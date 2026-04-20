import Docker from 'dockerode';
import * as si from 'systeminformation';
import { redis } from '../lib/redis';

const docker = new Docker(
    process.platform === 'win32'
        ? { socketPath: '//./pipe/docker_engine' }
        : { socketPath: '/var/run/docker.sock' },
);
const REDIS_KEY = 'system:metrics';
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
}

export interface SystemMetrics {
    collectedAt: string;
    host: {
        cpuPercent: number;
        memUsedMb: number;
        memTotalMb: number;
        memPercent: number;
        uptime: number; // seconds
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

        // Network — sum all interfaces
        const netStats = stats.networks ?? {};
        const netRx = Object.values(netStats).reduce((a: number, n: any) => a + (n.rx_bytes ?? 0), 0);
        const netTx = Object.values(netStats).reduce((a: number, n: any) => a + (n.tx_bytes ?? 0), 0);

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
        };
    } catch {
        return null;
    }
}

async function collectMetrics(): Promise<SystemMetrics> {
    const [cpuData, memData, timeData, containers] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.time(),
        docker.listContainers(),
    ]);

    const containerMetrics = await Promise.all(
        containers.map((c) => getContainerStats(docker.getContainer(c.Id))),
    );

    return {
        collectedAt: new Date().toISOString(),
        host: {
            cpuPercent: Math.round(cpuData.currentLoad * 10) / 10,
            memUsedMb: Math.round(memData.used / 1024 / 1024),
            memTotalMb: Math.round(memData.total / 1024 / 1024),
            memPercent: Math.round((memData.used / memData.total) * 100 * 10) / 10,
            uptime: Math.floor(timeData.uptime),
        },
        containers: containerMetrics.filter(Boolean) as ContainerMetric[],
    };
}

export async function startMetricsWorker() {
    async function tick() {
        try {
            const metrics = await collectMetrics();
            await redis.set(REDIS_KEY, JSON.stringify(metrics), 'EX', 90);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            const isSocketError = message.includes('ENOENT') || message.includes('ECONNREFUSED');
            if (isSocketError) {
                console.warn('[metrics] Docker socket unavailable — skipping collection');
            } else {
                console.error('[metrics] collection failed:', err);
            }
        }
    }

    await tick(); // collect immediately on startup
    const timer = setInterval(tick, INTERVAL_MS);
    // Don't hold the process open if everything else has stopped
    timer.unref?.();
}