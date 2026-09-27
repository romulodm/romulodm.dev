'use client';

/**
 * /admin/contact — caixa de entrada do formulário de contato.
 *
 * Tabela + modal, no mesmo molde de `admin/banned-users`: página client-side
 * que busca da API, com filtros no topo e paginação embaixo.
 *
 * O modal existe porque a mensagem é a única coluna que não cabe numa linha de
 * tabela. Abrir o modal também marca como lida — se você leu, o estado deve
 * refletir isso sem exigir um segundo clique.
 *
 * O modal aberto aparece na URL como `?message=<id>`, o que torna cada mensagem
 * endereçável — é esse link que a notificação do Telegram manda. Duas decisões
 * ali valem explicação:
 *
 * 1. A URL é escrita com `window.history.replaceState`, não com `router.replace`.
 *    O subtree /admin é `force-dynamic`, então passar pelo router refaria o
 *    payload RSC a cada abrir e fechar de modal — uma ida ao servidor para
 *    trocar um parâmetro que só o cliente lê. `replaceState` é suportado pela
 *    Next desde a 14.1 exatamente para este caso.
 *
 * 2. `replace` e não `push`: quem chega pelo link já gastou sua entrada no
 *    histórico nesta página. Com `push`, fechar o modal e apertar voltar
 *    reabriria ele, e sair da página exigiria dois cliques.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, Trash2, X } from 'lucide-react';

import { getIntlLocaleCode } from '@/lib/locales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CONTACT_STATUSES,
  CONTACT_TOPICS,
  type ContactStatusValue,
  type ContactTopicValue,
} from '@/lib/contact-topics';

// ── Tipos ────────────────────────────────────────────────────────────────────

// Vem de `lib/contact-topics.ts`, que é seguro para o cliente (só constantes,
// sem `zod` nem `node:crypto`). Antes esta página redeclarava as duas listas, e
// uma delas ia dessincronizar do enum do Prisma mais cedo ou mais tarde.
type Status = ContactStatusValue;
type Topic = ContactTopicValue;

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: Topic;
  message: string;
  status: Status;
  locale: string;
  createdAt: string;
  readAt: string | null;
  repliedAt: string | null;
  closedAt: string | null;
}

interface ApiResponse {
  items: ContactMessage[];
  unread: number;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const STATUSES = CONTACT_STATUSES;
const TOPICS = CONTACT_TOPICS;

/**
 * Cor por status. Semântica, não decorativa: o que precisa de ação puxa a
 * atenção, o que já foi resolvido recua para o cinza.
 */
const STATUS_STYLE: Record<Status, string> = {
  RECEIVED: 'bg-primary/15 text-primary border-primary/30',
  READ: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  REPLIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CLOSED: 'bg-muted text-muted-foreground border-border',
  SPAM: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const SELECT_CLASS =
  'rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

// ── Página ───────────────────────────────────────────────────────────────────

export default function AdminContactPage() {
  const t = useTranslations('admin.contact');
  const locale = useLocale();
  const localeCode = getIntlLocaleCode(locale);

  const [items, setItems] = useState<ContactMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('');
  const [topic, setTopic] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkMissing, setLinkMissing] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Dados ──────────────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(status ? { status } : {}),
        ...(topic ? { topic } : {}),
        ...(search ? { search } : {}),
      });

      const res = await fetch(`/api/admin/contact?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ApiResponse = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (error) {
      console.error('Failed to fetch contact messages', error);
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, status, topic, search]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Filtro novo sempre volta para a primeira página: manter a página 4 depois
  // de filtrar deixa a tela vazia sem explicação.
  function changeFilter(setter: (value: string) => void, value: string) {
    setPage(1);
    setter(value);
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(value.trim());
    }, 350);
  }

  // ── Ações ──────────────────────────────────────────────────────────────────

  const updateStatus = useCallback(
    async (id: string, next: Status) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/admin/contact/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Atualização otimista da linha e do modal aberto, para o clique
        // parecer instantâneo; o refetch depois reconcilia contadores.
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: next } : item)),
        );
        setSelected((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev));
        fetchMessages();
      } catch (error) {
        console.error('Failed to update status', error);
      } finally {
        setBusy(false);
      }
    },
    [fetchMessages],
  );

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      close();
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete message', error);
    } finally {
      setBusy(false);
    }
  }

  /** Id que o efeito de deep link abaixo já resolveu. */
  const linkedId = useRef<string | null>(null);

  /**
   * Escreve (ou apaga) o `?message=` sem passar pelo router — ver o cabeçalho
   * do arquivo. Os outros parâmetros da URL ficam onde estão.
   */
  const syncUrl = useCallback(
    (id: string | null) => {
      // O efeito de deep link observa esta mesma URL. Marcar o id aqui é o que
      // impede que abrir o modal pela tabela — que também escreve na URL —
      // dispare um fetch redundante e um segundo `updateStatus`.
      linkedId.current = id;

      const params = new URLSearchParams(window.location.search);
      if (id) params.set('message', id);
      else params.delete('message');

      const query = params.toString();
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
    },
    [pathname],
  );

  /** Abrir é ler: marca RECEIVED como READ sem exigir um segundo clique. */
  const open = useCallback(
    (message: ContactMessage) => {
      setSelected(message);
      syncUrl(message.id);
      if (message.status === 'RECEIVED') updateStatus(message.id, 'READ');
    },
    [syncUrl, updateStatus],
  );

  function close() {
    setSelected(null);
    syncUrl(null);
  }

  /*
   * Deep link: `?message=<id>` na chegada abre aquela mensagem.
   *
   * Busca sempre pela API, mesmo que o id esteja na página carregada. A
   * listagem é paginada e filtrada — a mensagem do link pode estar na página 7,
   * ou fora do filtro que ficou salvo. Procurar em `items` acertaria na maioria
   * das vezes e falharia justamente nas antigas, que é quando você abre um link
   * velho.
   *
   * Roda uma vez por id: o ref evita reabrir o modal quando `updateStatus`
   * recria suas dependências, e evita brigar com o fechamento manual.
   *
   * Sem flag de cancelamento no cleanup, de propósito. Em dev o StrictMode
   * monta o efeito duas vezes: a primeira passada dispararia o fetch e o
   * cleanup o marcaria como cancelado, a segunda cairia no guard do ref — e o
   * modal não abriria em lugar nenhum. Como isto é um GET único que não
   * disputa nada, o pior caso de deixar rodar é um `setState` depois do
   * unmount, que no React 18+ é no-op.
   */
  useEffect(() => {
    const id = searchParams.get('message');
    if (!id || linkedId.current === id) return;
    linkedId.current = id;

    (async () => {
      try {
        const res = await fetch(`/api/admin/contact/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        open((await res.json()) as ContactMessage);
      } catch (error) {
        // Mensagem apagada, ou id inventado. Avisa e limpa a URL, em vez de
        // deixar a página parecendo normal com um link que não faz nada.
        console.error('Failed to open linked message', error);
        setLinkMissing(true);
        syncUrl(null);
      }
    })();
  }, [searchParams, open, syncUrl]);

  // ── Formatação ─────────────────────────────────────────────────────────────

  const fmtDate = (value: string) =>
    new Intl.DateTimeFormat(localeCode, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  const StatusChip = ({ value }: { value: Status }) => (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[value]}`}
    >
      {t(`status.${value}`)}
    </span>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('description')}
          {unread > 0 && (
            <span className="ml-2 text-primary font-medium">
              {t('unreadCount', { count: unread })}
            </span>
          )}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={`${SELECT_CLASS} w-full max-w-xs placeholder:text-muted-foreground`}
        />

        <select
          value={status}
          onChange={(e) => changeFilter(setStatus, e.target.value)}
          className={SELECT_CLASS}
          aria-label={t('filters.status')}
        >
          <option value="">{t('filters.allStatuses')}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`status.${value}`)}
            </option>
          ))}
        </select>

        <select
          value={topic}
          onChange={(e) => changeFilter(setTopic, e.target.value)}
          className={SELECT_CLASS}
          aria-label={t('filters.topic')}
        >
          <option value="">{t('filters.allTopics')}</option>
          {TOPICS.map((value) => (
            <option key={value} value={value}>
              {t(`topic.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {linkMissing && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          <p className="flex-1">{t('linkMissing')}</p>
          <button
            onClick={() => setLinkMissing(false)}
            aria-label={t('dismiss')}
            className="shrink-0 rounded p-0.5 transition-colors hover:bg-amber-500/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">{t('loading')}</p>}

      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Mail className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}

      {/* Tabela */}
      {!loading && items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t('table.from')}
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    {t('table.topic')}
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                    {t('table.message')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t('table.status')}
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    {t('table.received')}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-muted/40 ${
                      item.status === 'RECEIVED' ? 'bg-primary/[0.04]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {t(`topic.${item.topic}`)}
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 lg:table-cell">
                      <p className="truncate text-muted-foreground">{item.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip value={item.status} />
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                      {fmtDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => open(item)}
                        className="rounded border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                      >
                        {t('openMessage')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {t('pagination.showing', {
              from: (page - 1) * 20 + 1,
              to: Math.min(page * 20, total),
              total,
            })}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-border px-3 py-1.5 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('pagination.previous')}
            </button>
            <span className="px-3 py-1.5">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-border px-3 py-1.5 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* Modal da mensagem */}
      <Dialog open={selected !== null} onOpenChange={(value) => !value && close()}>
        <DialogContent className="border-border bg-background sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-primary hover:underline"
                  >
                    {selected.email}
                  </a>
                  {' · '}
                  {t(`topic.${selected.topic}`)}
                  {' · '}
                  {fmtDate(selected.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <p className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
                {selected.message}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="mr-1 text-xs text-muted-foreground">
                  {t('markAs')}
                </span>

                {STATUSES.map((value) => (
                  <button
                    key={value}
                    disabled={busy || selected.status === value}
                    onClick={() => updateStatus(selected.id, value)}
                    className={`rounded border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed ${
                      selected.status === value
                        ? STATUS_STYLE[value]
                        : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {t(`status.${value}`)}
                  </button>
                ))}

                <button
                  disabled={busy}
                  onClick={() => remove(selected.id)}
                  className="ml-auto flex items-center gap-1.5 rounded border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('delete')}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
