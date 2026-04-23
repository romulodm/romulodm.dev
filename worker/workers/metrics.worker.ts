import Docker from 'dockerode';
import * as si from 'systeminformation';
import { redis } from '../lib/redis';

const docker = new Docker(
    process.platform === 'win32'
        ? { socketPath: '//./pipe/docker_engine' }
        : { socketPath: '/var/run/docker.sock' },
);

const REDIS_KEY = 'system:metrics';
const REDIS_HISTORY_KEY = 'system:metrics:history';
const HISTORY_MAX = 120; // 120 × 30 s = 1 hora de histórico
const INTERVAL_MS = 30_000;

export interface ContainerMetric {
    id: string;
    name: string;
    status: string;
    cpuPercent: number;
    memUsageMb: number;
    memLimitMb: number;
    memPercent: number;
    netRxMb: number;
    netTxMb: number;
    ioReadMb: number;
    ioWriteMb: number;
}

export interface SystemMetrics {
    collectedAt: string;
    host: {
        cpuPercent: number;
        memUsedMb: number;
        memTotalMb: number;
        memPercent: number;
        uptime: number;
    };
    docker: {
        volumeCount: number;
        imageCount: number;
        imageSizeMb: number;
    };
    containers: ContainerMetric[];
}

async function getContainerStats(container: Docker.Container): Promise<ContainerMetric | null> {
    try {
        const [info, stats] = await Promise.all([
            container.inspect(),
            new Promise<any>((resolve, reject) => {
                container.stats({ stream: false }, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            }),
        ]);

        // CPU %
        const cpuDelta =
            stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const sysDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const numCpus = stats.cpu_stats.online_cpus ?? 1;
        const cpuPercent = sysDelta > 0 ? (cpuDelta / sysDelta) * numCpus * 100 : 0;

        // Memory
        const memUsage = stats.memory_stats.usage ?? 0;
        const memLimit = stats.memory_stats.limit ?? 1;

        // Network — soma todas as interfaces
        const netStats = stats.networks ?? {};
        const netRx = Object.values(netStats).reduce((a: number, n: any) => a + (n.rx_bytes ?? 0), 0);
        const netTx = Object.values(netStats).reduce((a: number, n: any) => a + (n.tx_bytes ?? 0), 0);

        // I/O — blkio_stats (Linux; pode ser 0 em cgroups v2 sem permissão)
        const blkio: { op: string; value: number }[] =
            stats.blkio_stats?.io_service_bytes_recursive ?? [];
        const ioRead = blkio
            .filter((e) => e.op?.toLowerCase() === 'read')
            .reduce((a, e) => a + (e.value ?? 0), 0);
        const ioWrite = blkio
            .filter((e) => e.op?.toLowerCase() === 'write')
            .reduce((a, e) => a + (e.value ?? 0), 0);

        return {
            id: info.Id.slice(0, 12),
            name: info.Name.replace(/^\//, ''),
            status: info.State.Status,
            cpuPercent: Math.round(cpuPercent * 10) / 10,
            memUsageMb: Math.round(memUsage / 1024 / 1024),
            memLimitMb: Math.round(memLimit / 1024 / 1024),
            memPercent: Math.round((memUsage / memLimit) * 100 * 10) / 10,
            netRxMb: Math.round(((netRx as number) / 1024 / 1024) * 100) / 100,
            netTxMb: Math.round(((netTx as number) / 1024 / 1024) * 100) / 100,
            ioReadMb: Math.round((ioRead / 1024 / 1024) * 100) / 100,
            ioWriteMb: Math.round((ioWrite / 1024 / 1024) * 100) / 100,
        };
    } catch {
        return null;
    }
}

async function collectMetrics(): Promise<SystemMetrics> {
    const [cpuData, memData, timeData] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.time(),
    ]);

    let containerMetrics: ContainerMetric[] = [];
    let dockerInfo = { volumeCount: 0, imageCount: 0, imageSizeMb: 0 };

    try {
        const [containers, volumesData, images] = await Promise.all([
            docker.listContainers(),
            docker.listVolumes(),
            docker.listImages(),
        ]);

        const results = await Promise.all(
            containers.map((c) => getContainerStats(docker.getContainer(c.Id))),
        );
        containerMetrics = results.filter(Boolean) as ContainerMetric[];

        const totalImageSize = images.reduce((sum, img) => sum + (img.Size ?? 0), 0);

        dockerInfo = {
            volumeCount: volumesData.Volumes?.length ?? 0,
            imageCount: images.length,
            imageSizeMb: Math.round(totalImageSize / 1024 / 1024),
        };
    } catch {
        // Docker indisponível — continua sem containers
    }

    return {
        collectedAt: new Date().toISOString(),
        host: {
            cpuPercent: Math.round(cpuData.currentLoad * 10) / 10,
            memUsedMb: Math.round(memData.used / 1024 / 1024),
            memTotalMb: Math.round(memData.total / 1024 / 1024),
            memPercent: Math.round((memData.used / memData.total) * 100 * 10) / 10,
            uptime: Math.floor(timeData.uptime),
        },
        docker: dockerInfo,
        containers: containerMetrics,
    };
}

export async function startMetricsWorker() {
    async function tick() {
        try {
            const metrics = await collectMetrics();
            const serialized = JSON.stringify(metrics);

            // Salva snapshot atual (TTL 90s — exclui se o worker parar)
            await redis.set(REDIS_KEY, serialized, 'EX', 90);

            // Adiciona ao histórico e mantém os últimos HISTORY_MAX registros
            await redis.lpush(REDIS_HISTORY_KEY, serialized);
            await redis.ltrim(REDIS_HISTORY_KEY, 0, HISTORY_MAX - 1);

            console.log('[metrics] saved to redis at', metrics.collectedAt);
        } catch (err: unknown) {
            console.error('[metrics] collection failed:', err);
        }
    }

    await tick();
    const timer = setInterval(tick, INTERVAL_MS);
    timer.unref?.();
}