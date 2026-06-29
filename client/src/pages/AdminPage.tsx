import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Gift,
  Image,
  LogOut,
  PackagePlus,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { api, mediaUrl } from "../lib/api";
import { photos, photoUrl } from "../data/photos";
import type {
  GiftGroupPayload,
  GiftGroupRecord,
  GiftOrderRecord,
  GiftPayload,
  GiftRecord,
  RsvpPayload,
  RsvpRecord,
  RsvpStats
} from "../types";

const tokenKey = "daiane-augusto-admin-token";
const giftsPerPage = 5;

const emptyStats: RsvpStats = {
  totalResponses: 0,
  totalAttending: 0,
  totalNotAttending: 0,
  totalGuests: 0
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`));

type CsvValue = string | number | boolean | null | undefined;

const csvEscape = (value: CsvValue) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const formatCurrency = (cents: number) =>
  cents > 0
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(cents / 100)
    : "Valor a definir";

const priceInputToCents = (value: string) => {
  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const amount = Number(normalized || 0);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};

const centsToPriceInput = (cents: number) =>
  cents > 0 ? (cents / 100).toFixed(2).replace(".", ",") : "";

const imagePositionOptions = [
  { label: "Centro", value: "center center" },
  { label: "Topo", value: "center top" },
  { label: "Base", value: "center bottom" },
  { label: "Esquerda", value: "left center" },
  { label: "Direita", value: "right center" },
  { label: "Topo esquerda", value: "left top" },
  { label: "Topo direita", value: "right top" },
  { label: "Base esquerda", value: "left bottom" },
  { label: "Base direita", value: "right bottom" }
];

const imageFitOptions = [
  { label: "Mostrar inteira", value: "contain" },
  { label: "Preencher card", value: "cover" }
] as const;

const giftPurchaseStatusCopy = {
  available: "Disponível",
  reserved: "Reservado",
  sold: "Presenteado"
} as const;

const giftOrderStatusCopy: Record<GiftOrderRecord["status"], string> = {
  reserved: "Reservado",
  checkout_pending: "Checkout pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
  cancelled: "Cancelado"
};

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [stats, setStats] = useState<RsvpStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [editing, setEditing] = useState<RsvpRecord | null>(null);
  const [giftGroups, setGiftGroups] = useState<GiftGroupRecord[]>([]);
  const [giftOrders, setGiftOrders] = useState<GiftOrderRecord[]>([]);
  const [isGiftsLoading, setIsGiftsLoading] = useState(false);
  const [isGiftOrdersLoading, setIsGiftOrdersLoading] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<GiftGroupRecord | null>(null);
  const [editingGift, setEditingGift] = useState<GiftRecord | null>(null);
  const [giftGroupFilter, setGiftGroupFilter] = useState("all");
  const [giftPage, setGiftPage] = useState(1);
  const [giftImageUrl, setGiftImageUrl] = useState("");
  const [giftImageFit, setGiftImageFit] =
    useState<GiftPayload["imageFit"]>("contain");
  const [giftImagePosition, setGiftImagePosition] = useState("center center");
  const [isUploadingGiftImage, setIsUploadingGiftImage] = useState(false);
  const groupFormRef = useRef<HTMLFormElement>(null);
  const giftFormRef = useRef<HTMLFormElement>(null);
  const giftListsRef = useRef<HTMLDivElement>(null);

  const focusAdminSection = (
    ref: RefObject<HTMLElement | null>,
    focusSelector?: string
  ) => {
    if (!window.matchMedia("(max-width: 1023px)").matches) {
      return;
    }

    window.requestAnimationFrame(() => {
      const section = ref.current;

      if (!section) return;

      section.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start"
      });

      const focusTarget = focusSelector
        ? section.querySelector<HTMLElement>(focusSelector)
        : section;
      focusTarget?.focus({ preventScroll: true });
    });
  };

  const editGroup = (group: GiftGroupRecord) => {
    setEditingGroup(group);
    setGiftError(null);
    setGiftMessage(null);
    focusAdminSection(groupFormRef, 'input[name="name"]');
  };

  const editGift = (gift: GiftRecord) => {
    setEditingGift(gift);
    setGiftError(null);
    setGiftMessage(null);
    focusAdminSection(giftFormRef, 'input[name="name"]');
  };

  const loadRsvps = async (activeToken = token) => {
    if (!activeToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.listRsvps(activeToken);
      setRsvps(result.rsvps);
      setStats(result.stats);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as confirmações."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadGifts = async (activeToken = token) => {
    if (!activeToken) return;
    setIsGiftsLoading(true);
    setGiftError(null);

    try {
      const result = await api.listGifts();
      setGiftGroups(result.groups);
    } catch (loadError) {
      setGiftError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os presentes."
      );
    } finally {
      setIsGiftsLoading(false);
    }
  };

  const loadGiftOrders = async (activeToken = token) => {
    if (!activeToken) return;
    setIsGiftOrdersLoading(true);

    try {
      const result = await api.listGiftOrders(activeToken);
      setGiftOrders(result.orders);
    } catch (loadError) {
      setGiftError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as ordens."
      );
    } finally {
      setIsGiftOrdersLoading(false);
    }
  };

  useEffect(() => {
    void loadRsvps();
    void loadGifts();
    void loadGiftOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setGiftImageUrl(editingGift?.imageUrl ?? "");
    setGiftImageFit(editingGift?.imageFit || "contain");
    setGiftImagePosition(editingGift?.imagePosition || "center center");
  }, [editingGift]);

  const filtered = useMemo(() => {
    return rsvps.filter((rsvp) => {
      const text = `${rsvp.name} ${rsvp.phone} ${rsvp.inviteeNames}`.toLowerCase();
      const matchesQuery = text.includes(query.trim().toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "yes" && rsvp.attending) ||
        (filter === "no" && !rsvp.attending);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, rsvps]);

  const allGifts = useMemo(
    () => giftGroups.flatMap((group) => group.gifts),
    [giftGroups]
  );

  const filteredGifts = useMemo(
    () =>
      giftGroupFilter === "all"
        ? allGifts
        : allGifts.filter((gift) => gift.groupId === Number(giftGroupFilter)),
    [allGifts, giftGroupFilter]
  );

  const totalGiftPages = Math.max(
    1,
    Math.ceil(filteredGifts.length / giftsPerPage)
  );

  const paginatedGiftGroups = useMemo(() => {
    const firstIndex = (giftPage - 1) * giftsPerPage;
    const pageGiftIds = new Set(
      filteredGifts
        .slice(firstIndex, firstIndex + giftsPerPage)
        .map((gift) => gift.id)
    );

    return giftGroups
      .map((group) => ({
        ...group,
        gifts: group.gifts.filter((gift) => pageGiftIds.has(gift.id))
      }))
      .filter((group) => group.gifts.length > 0);
  }, [filteredGifts, giftGroups, giftPage]);

  useEffect(() => {
    setGiftPage(1);
  }, [giftGroupFilter]);

  useEffect(() => {
    setGiftPage((currentPage) => Math.min(currentPage, totalGiftPages));
  }, [totalGiftPages]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const result = await api.login(password);
      localStorage.setItem(tokenKey, result.token);
      setToken(result.token);
      setPassword("");
    } catch (loginIssue) {
      setLoginError(
        loginIssue instanceof Error ? loginIssue.message : "Não foi possível entrar."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setRsvps([]);
    setStats(emptyStats);
    setGiftGroups([]);
    setGiftOrders([]);
    setEditingGift(null);
    setEditingGroup(null);
  };

  const exportCsv = () => {
    const header = [
      "Nome",
      "Telefone",
      "Status",
      "Quantidade",
      "Nomes do convite",
      "Observações",
      "Criado em"
    ];
    const rows = filtered.map((rsvp) => [
      rsvp.name,
      rsvp.phone,
      rsvp.attending ? "Confirmado" : "Não comparecerá",
      rsvp.partySize,
      rsvp.inviteeNames,
      rsvp.notes,
      formatDate(rsvp.createdAt)
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((item) => csvEscape(item)).join(";"))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "confirmacoes-casamento.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (record: RsvpRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`Excluir a confirmação de ${record.name}?`);
    if (!confirmed) return;

    await api.deleteRsvp(record.id, token);
    await loadRsvps(token);
  };

  const saveGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: GiftGroupPayload = {
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim()
    };

    setGiftError(null);
    setGiftMessage(null);

    try {
      if (editingGroup) {
        await api.updateGiftGroup(editingGroup.id, token, payload);
        setGiftMessage("Grupo atualizado.");
      } else {
        await api.createGiftGroup(token, payload);
        setGiftMessage("Grupo cadastrado.");
      }

      setEditingGroup(null);
      formElement.reset();
      await loadGifts(token);
      focusAdminSection(giftListsRef);
    } catch (saveError) {
      setGiftError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar o grupo."
      );
    }
  };

  const removeGroup = async (group: GiftGroupRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`Excluir o grupo ${group.name}?`);
    if (!confirmed) return;

    try {
      await api.deleteGiftGroup(group.id, token);
      setGiftMessage("Grupo excluído.");
      await loadGifts(token);
    } catch (removeError) {
      setGiftError(
        removeError instanceof Error
          ? removeError.message
          : "Não foi possível excluir o grupo."
      );
    }
  };

  const saveGift = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: GiftPayload = {
      groupId: Number(form.get("groupId") || 0),
      name: String(form.get("name") || "").trim(),
      imageUrl: String(form.get("imageUrl") || "").trim(),
      imageFit:
        String(form.get("imageFit") || "contain") === "cover" ? "cover" : "contain",
      imagePosition: String(form.get("imagePosition") || "center center"),
      priceCents: priceInputToCents(String(form.get("price") || "")),
      purchaseStatus:
        String(form.get("purchaseStatus") || "available") === "reserved"
          ? "reserved"
          : String(form.get("purchaseStatus") || "available") === "sold"
            ? "sold"
            : "available"
    };

    setGiftError(null);
    setGiftMessage(null);

    try {
      if (editingGift) {
        await api.updateGift(editingGift.id, token, payload);
        setGiftMessage("Presente atualizado.");
      } else {
        await api.createGift(token, payload);
        setGiftMessage("Presente cadastrado.");
      }

      setEditingGift(null);
      setGiftImageUrl("");
      setGiftImageFit("contain");
      setGiftImagePosition("center center");
      formElement.reset();
      await loadGifts(token);
      focusAdminSection(giftListsRef);
    } catch (saveError) {
      setGiftError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar o presente."
      );
    }
  };

  const uploadGiftImage = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!token) return;
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setGiftError(null);
    setGiftMessage(null);
    setIsUploadingGiftImage(true);

    try {
      const result = await api.uploadGiftImage(token, file);
      setGiftImageUrl(result.imageUrl);
      setGiftMessage("Imagem carregada.");
    } catch (uploadError) {
      setGiftError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível carregar a imagem."
      );
    } finally {
      setIsUploadingGiftImage(false);
    }
  };

  const removeGift = async (gift: GiftRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`Excluir o presente ${gift.name}?`);
    if (!confirmed) return;

    try {
      await api.deleteGift(gift.id, token);
      setGiftMessage("Presente excluído.");
      await loadGifts(token);
      await loadGiftOrders(token);
    } catch (removeError) {
      setGiftError(
        removeError instanceof Error
          ? removeError.message
          : "Não foi possível excluir o presente."
      );
    }
  };

  const releaseOrder = async (order: GiftOrderRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`Liberar a reserva de ${order.giftName}?`);
    if (!confirmed) return;

    try {
      await api.releaseGiftOrder(order.id, token);
      setGiftMessage("Reserva liberada.");
      await loadGifts(token);
      await loadGiftOrders(token);
    } catch (releaseError) {
      setGiftError(
        releaseError instanceof Error
          ? releaseError.message
          : "Não foi possível liberar a reserva."
      );
    }
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editing) return;

    const form = new FormData(event.currentTarget);
    const attending = form.get("attending") === "yes";
    const payload: RsvpPayload = {
      name: String(form.get("name") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      attending,
      partySize: attending ? Number(form.get("partySize") || 1) : 0,
      inviteeNames: String(form.get("inviteeNames") || "").trim(),
      notes: String(form.get("notes") || "").trim()
    };

    await api.updateRsvp(editing.id, token, payload);
    setEditing(null);
    await loadRsvps(token);
  };

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-28">
        <div className="absolute inset-0 -z-10">
          <img
            src={photoUrl(photos.admin)}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/55" />
        </div>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[1.5rem] border border-white/35 bg-ivory/92 p-6 shadow-soft backdrop-blur"
        >
          <ShieldCheck className="text-plum" size={30} />
          <h1 className="mt-5 font-display text-5xl font-semibold text-moss">
            Área dos noivos
          </h1>
          <p className="mt-3 text-sm leading-7 text-ink/68">
            Acesse as confirmações de presença do casamento.
          </p>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-moss">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-ink shadow-sm"
            />
          </label>
          {loginError ? (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-800">
              {loginError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="focus-ring mt-6 min-h-12 w-full rounded-full bg-moss px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-ink disabled:opacity-65"
          >
            {isLoggingIn ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="pt-28">
      <section className="page-shell py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-plum">
              Painel administrativo
            </p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-moss">
              Confirmações de presença
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void loadRsvps();
                void loadGifts();
                void loadGiftOrders();
              }}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-moss/15 bg-white/70 px-4 py-2 text-sm font-semibold text-moss"
            >
              <RefreshCcw size={16} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-moss/15 bg-white/70 px-4 py-2 text-sm font-semibold text-moss"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              type="button"
              onClick={logout}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-ivory"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Respostas", stats.totalResponses],
            ["Confirmados", stats.totalAttending],
            ["Pessoas", stats.totalGuests],
            ["Não poderão ir", stats.totalNotAttending]
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-moss/10 bg-white/72 p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
                {label}
              </p>
              <p className="mt-3 font-display text-4xl font-semibold text-moss">
                {value}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-moss/10 bg-white/72 p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-plum">
                Lista de presentes
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold text-moss">
                Cadastro dos presentes
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                void loadGifts();
                void loadGiftOrders();
              }}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-moss/15 bg-white px-4 py-2 text-sm font-semibold text-moss"
            >
              <RefreshCcw size={16} />
              Atualizar presentes
            </button>
          </div>

          {giftError ? (
            <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800">
              {giftError}
            </p>
          ) : null}
          {giftMessage ? (
            <p className="mt-5 rounded-2xl bg-sage/15 p-4 text-sm font-semibold text-moss">
              {giftMessage}
            </p>
          ) : null}

          <div className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-5">
              <form
                ref={groupFormRef}
                key={editingGroup?.id ?? "new-group"}
                onSubmit={saveGroup}
                tabIndex={-1}
                className="scroll-mt-24 rounded-2xl border border-moss/10 bg-ivory/70 p-4 outline-none"
              >
                <div className="flex items-center gap-2 text-moss">
                  <Plus size={18} />
                  <h3 className="font-semibold">
                    {editingGroup ? "Editar grupo" : "Novo grupo"}
                  </h3>
                </div>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-moss">Grupo</span>
                  <input
                    name="name"
                    defaultValue={editingGroup?.name ?? ""}
                    placeholder="Ex.: Cozinha"
                    className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-moss">
                    Descrição
                  </span>
                  <textarea
                    name="description"
                    defaultValue={editingGroup?.description ?? ""}
                    rows={3}
                    placeholder="Texto curto para aparecer na página pública"
                    className="focus-ring mt-2 w-full resize-none rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-ivory"
                  >
                    <Plus size={16} />
                    {editingGroup ? "Salvar grupo" : "Adicionar grupo"}
                  </button>
                  {editingGroup ? (
                    <button
                      type="button"
                      onClick={() => setEditingGroup(null)}
                      className="focus-ring rounded-full border border-moss/15 px-4 py-2 text-sm font-semibold text-moss"
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </form>

              <form
                ref={giftFormRef}
                key={editingGift?.id ?? "new-gift"}
                onSubmit={saveGift}
                tabIndex={-1}
                className="scroll-mt-24 rounded-2xl border border-moss/10 bg-ivory/70 p-4 outline-none"
              >
                <div className="flex items-center gap-2 text-moss">
                  <PackagePlus size={18} />
                  <h3 className="font-semibold">
                    {editingGift ? "Editar presente" : "Novo presente"}
                  </h3>
                </div>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-moss">Grupo</span>
                  <select
                    name="groupId"
                    defaultValue={editingGift?.groupId ?? giftGroups[0]?.id ?? ""}
                    disabled={giftGroups.length === 0}
                    className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
                  >
                    {giftGroups.length === 0 ? (
                      <option value="">Cadastre um grupo primeiro</option>
                    ) : null}
                    {giftGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-moss">
                    Nome do presente
                  </span>
                  <input
                    name="name"
                    defaultValue={editingGift?.name ?? ""}
                    placeholder="Ex.: Micro-ondas"
                    className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-moss">
                    Valor fixo
                  </span>
                  <input
                    name="price"
                    inputMode="decimal"
                    defaultValue={
                      editingGift ? centsToPriceInput(editingGift.priceCents) : ""
                    }
                    placeholder="Ex.: 299,90"
                    className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-moss">
                    Status do presente
                  </span>
                  <select
                    name="purchaseStatus"
                    defaultValue={editingGift?.purchaseStatus ?? "available"}
                    className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
                  >
                    {Object.entries(giftPurchaseStatusCopy).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-4 block">
                  <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-semibold text-moss">Imagem</span>
                    <label
                      aria-disabled={isUploadingGiftImage}
                      className="focus-ring inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-moss/15 bg-white px-4 py-2 text-sm font-semibold text-moss sm:min-h-9 sm:w-auto sm:px-3 sm:py-1 sm:text-xs aria-disabled:pointer-events-none aria-disabled:opacity-70"
                    >
                      <Image size={15} />
                      {isUploadingGiftImage ? "Carregando" : "Carregar imagem"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={uploadGiftImage}
                        disabled={isUploadingGiftImage}
                        className="sr-only"
                      />
                    </label>
                  </span>
                  {giftImageUrl ? (
                    <span className="mt-2 block overflow-hidden rounded-2xl border border-moss/10 bg-linen">
                      <img
                        src={mediaUrl(giftImageUrl)}
                        alt=""
                        className="aspect-[4/3] w-full object-cover"
                        style={{
                          objectFit: giftImageFit,
                          objectPosition: giftImagePosition
                        }}
                        loading="lazy"
                      />
                    </span>
                  ) : null}
                  <div className="mt-2 flex rounded-2xl border border-moss/15 bg-white">
                    <span className="grid w-12 place-items-center text-moss/55">
                      <Image size={17} />
                    </span>
                    <input
                      name="imageUrl"
                      value={giftImageUrl}
                      onChange={(event) => setGiftImageUrl(event.target.value)}
                      placeholder="https://..., /fotos/imagem.jpg ou /uploads/gifts/..."
                      className="focus-ring min-h-12 min-w-0 flex-1 rounded-2xl bg-transparent pr-4 text-sm"
                    />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="block text-sm font-semibold text-moss">
                        Modo da imagem
                      </span>
                      <select
                        name="imageFit"
                        value={giftImageFit}
                        onChange={(event) =>
                          setGiftImageFit(
                            event.target.value === "contain" ? "contain" : "cover"
                          )
                        }
                        className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
                      >
                        {imageFitOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-sm font-semibold text-moss">
                        Enquadramento
                      </span>
                      <select
                        name="imagePosition"
                        value={giftImagePosition}
                        onChange={(event) => setGiftImagePosition(event.target.value)}
                        className="focus-ring mt-2 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
                      >
                        {imagePositionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <span className="mt-2 block text-xs leading-5 text-ink/52">
                    Aceita JPG, PNG ou WebP até 2 MB.
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={giftGroups.length === 0}
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-ivory disabled:opacity-60"
                  >
                    <Gift size={16} />
                    {editingGift ? "Salvar presente" : "Adicionar presente"}
                  </button>
                  {editingGift ? (
                    <button
                      type="button"
                      onClick={() => setEditingGift(null)}
                      className="focus-ring rounded-full border border-moss/15 px-4 py-2 text-sm font-semibold text-moss"
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </form>
            </div>

            <div
              ref={giftListsRef}
              tabIndex={-1}
              className="scroll-mt-24 grid gap-5 outline-none lg:grid-cols-2"
              aria-label="Grupos e presentes cadastrados"
            >
              <div className="rounded-2xl border border-moss/10 bg-white p-4">
                <h3 className="font-semibold text-moss">Grupos cadastrados</h3>
                <div className="mt-4 space-y-3">
                  {giftGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-moss/10 bg-ivory/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{group.name}</p>
                          {group.description ? (
                            <p className="mt-1 text-xs leading-5 text-ink/58">
                              {group.description}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-moss/48">
                            {group.gifts.length} presente(s)
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => editGroup(group)}
                            className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-moss/15 text-moss"
                            aria-label="Editar grupo"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGroup(group)}
                            className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-700"
                            aria-label="Excluir grupo"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!isGiftsLoading && giftGroups.length === 0 ? (
                    <p className="rounded-xl bg-ivory p-4 text-sm text-ink/58">
                      Nenhum grupo cadastrado.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-moss/10 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-moss">
                      Presentes cadastrados
                    </h3>
                    <p className="mt-1 text-xs text-ink/52">
                      {filteredGifts.length} de {allGifts.length} presente(s)
                    </p>
                  </div>
                  <label className="block sm:min-w-44">
                    <span className="sr-only">Filtrar presentes por grupo</span>
                    <select
                      value={giftGroupFilter}
                      onChange={(event) => setGiftGroupFilter(event.target.value)}
                      className="focus-ring w-full rounded-xl border border-moss/15 bg-ivory px-3 py-2 text-sm text-moss"
                    >
                      <option value="all">Todos os grupos</option>
                      {giftGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 space-y-5">
                  {paginatedGiftGroups.map((group) => (
                    <section key={group.id} aria-labelledby={`admin-group-${group.id}`}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h4
                          id={`admin-group-${group.id}`}
                          className="text-xs font-bold uppercase tracking-[0.16em] text-plum"
                        >
                          {group.name}
                        </h4>
                        <span className="text-xs text-ink/44">
                          {group.gifts.length} nesta página
                        </span>
                      </div>
                      <div className="space-y-3">
                        {group.gifts.map((gift) => (
                          <div
                            key={gift.id}
                            className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border border-moss/10 bg-ivory/70 p-3"
                          >
                            <div className="h-20 overflow-hidden rounded-lg bg-linen">
                              <img
                                src={mediaUrl(gift.imageUrl)}
                                alt=""
                                className="h-full w-full object-cover"
                                style={{
                                  objectFit: gift.imageFit,
                                  objectPosition: gift.imagePosition
                                }}
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-ink">
                                    {gift.name}
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-moss">
                                    {formatCurrency(gift.priceCents)}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/42">
                                    {giftPurchaseStatusCopy[gift.purchaseStatus]}
                                  </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => editGift(gift)}
                                    className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-moss/15 text-moss"
                                    aria-label={`Editar ${gift.name}`}
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeGift(gift)}
                                    className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-700"
                                    aria-label={`Excluir ${gift.name}`}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}

                  {!isGiftsLoading && filteredGifts.length === 0 ? (
                    <p className="rounded-xl bg-ivory p-4 text-sm text-ink/58">
                      {allGifts.length === 0
                        ? "Nenhum presente cadastrado."
                        : "Nenhum presente cadastrado neste grupo."}
                    </p>
                  ) : null}
                </div>

                {filteredGifts.length > giftsPerPage ? (
                  <nav
                    className="mt-5 flex items-center justify-between gap-3 border-t border-moss/10 pt-4"
                    aria-label="Paginação dos presentes"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setGiftPage((currentPage) =>
                          Math.max(1, currentPage - 1)
                        )
                      }
                      disabled={giftPage === 1}
                      className="focus-ring inline-flex min-h-10 items-center gap-1 rounded-full border border-moss/15 px-3 py-2 text-xs font-semibold text-moss disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>
                    <span className="text-xs font-semibold text-ink/58">
                      Página {giftPage} de {totalGiftPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGiftPage((currentPage) =>
                          Math.min(totalGiftPages, currentPage + 1)
                        )
                      }
                      disabled={giftPage === totalGiftPages}
                      className="focus-ring inline-flex min-h-10 items-center gap-1 rounded-full border border-moss/15 px-3 py-2 text-xs font-semibold text-moss disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Próxima
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-moss/10 bg-white/72 p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-plum">
                Checkout
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold text-moss">
                Ordens de presentes
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                void loadGifts();
                void loadGiftOrders();
              }}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-moss/15 bg-white px-4 py-2 text-sm font-semibold text-moss"
            >
              <RefreshCcw size={16} />
              Atualizar ordens
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {giftOrders.map((order) => {
              const canRelease =
                order.status === "reserved" || order.status === "checkout_pending";

              return (
                <article
                  key={order.id}
                  className="rounded-xl border border-moss/10 bg-ivory/70 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{order.giftName}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-moss">
                          {giftOrderStatusCopy[order.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink/58">{order.groupName}</p>
                      <p className="mt-2 text-sm font-semibold text-moss">
                        {formatCurrency(order.amountCents)}
                      </p>
                      <p className="mt-2 break-all text-xs text-ink/45">
                        {order.externalReference}
                      </p>
                    </div>
                    <div className="grid gap-2 text-xs text-ink/58 sm:grid-cols-2 lg:min-w-[320px]">
                      <span>
                        Criada em
                        <strong className="mt-1 block text-ink/72">
                          {formatDate(order.createdAt)}
                        </strong>
                      </span>
                      <span>
                        Reserva atÃ©
                        <strong className="mt-1 block text-ink/72">
                          {order.reservedUntil
                            ? formatDate(order.reservedUntil)
                            : "-"}
                        </strong>
                      </span>
                    </div>
                    {canRelease ? (
                      <button
                        type="button"
                        onClick={() => releaseOrder(order)}
                        className="focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-moss/15 bg-white px-4 py-2 text-sm font-semibold text-moss"
                      >
                        Liberar reserva
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {!isGiftOrdersLoading && giftOrders.length === 0 ? (
              <p className="rounded-xl bg-ivory p-4 text-sm text-ink/58">
                Nenhuma ordem criada ainda.
              </p>
            ) : null}
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-moss/10 bg-white/70 p-4 shadow-sm md:flex-row">
          <label className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/42"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou telefone"
              className="focus-ring min-h-12 w-full rounded-full border border-moss/12 bg-white pl-11 pr-4 text-sm"
            />
          </label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            className="focus-ring min-h-12 rounded-full border border-moss/12 bg-white px-4 text-sm font-semibold text-moss"
          >
            <option value="all">Todos</option>
            <option value="yes">Confirmados</option>
            <option value="no">Não comparecerão</option>
          </select>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-moss/10 bg-white/76 shadow-sm">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-linen/70 text-xs uppercase tracking-[0.16em] text-moss">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Telefone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Qtd.</th>
                <th className="px-5 py-4">Pessoas do convite</th>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-moss/10">
              {filtered.map((rsvp) => (
                <tr key={rsvp.id} className="align-top">
                  <td className="px-5 py-4 font-semibold text-ink">{rsvp.name}</td>
                  <td className="px-5 py-4 text-ink/68">{rsvp.phone}</td>
                  <td className="px-5 py-4">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-bold",
                        rsvp.attending
                          ? "bg-sage/18 text-moss"
                          : "bg-lavender/20 text-plum"
                      ].join(" ")}
                    >
                      {rsvp.attending ? "Confirmado" : "Não irá"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink/68">{rsvp.partySize}</td>
                  <td className="px-5 py-4 text-ink/68">
                    {rsvp.inviteeNames || "-"}
                    {rsvp.notes ? (
                      <p className="mt-2 text-xs text-ink/48">{rsvp.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-ink/68">
                    {formatDate(rsvp.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(rsvp)}
                        className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-moss/15 text-moss"
                        aria-label="Editar confirmação"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(rsvp)}
                        className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-700"
                        aria-label="Excluir confirmação"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink/58">
              Nenhuma confirmação encontrada.
            </p>
          ) : null}
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-2xl rounded-[1.5rem] bg-ivory p-5 shadow-soft md:p-7"
          >
            <h2 className="font-display text-4xl font-semibold text-moss">
              Editar confirmação
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input name="name" defaultValue={editing.name} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3" />
              <input name="phone" defaultValue={editing.phone} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3" />
              <select name="attending" defaultValue={editing.attending ? "yes" : "no"} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3">
                <option value="yes">Confirmado</option>
                <option value="no">Não comparecerá</option>
              </select>
              <input name="partySize" type="number" min={0} defaultValue={editing.partySize} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3" />
              <input name="inviteeNames" defaultValue={editing.inviteeNames} className="focus-ring rounded-2xl border border-moss/15 bg-white px-4 py-3 md:col-span-2" />
              <textarea name="notes" defaultValue={editing.notes} rows={3} className="focus-ring resize-none rounded-2xl border border-moss/15 bg-white px-4 py-3 md:col-span-2" />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="focus-ring rounded-full border border-moss/15 px-5 py-3 text-sm font-semibold text-moss"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="focus-ring rounded-full bg-moss px-5 py-3 text-sm font-semibold text-ivory"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
