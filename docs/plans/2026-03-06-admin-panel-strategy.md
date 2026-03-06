# QA Audit Agent — Admin Panel: Strategic Analysis & Improvement Plan

**Date:** 2026-03-06
**Status:** Draft — awaiting approval

---

## 1. Competitive Landscape

### Direct Competitors (Audit + Outreach)

| Product | Model | Key Feature | Pricing | Weak Spot |
|---------|-------|-------------|---------|-----------|
| **My Web Audit** | Agency tool | AI audit reports (40+ factors), white-label, built-in email automation, HighLevel/Zapier integration | ~$50-200/mo | No self-service scan widget, agency-only |
| **MySiteAuditor** | Lead gen widget | Embeddable audit form on your site, 50+ SEO signals, 20 languages, unlimited leads | ~$39-99/mo | SEO-only (no QA/UX/accessibility) |
| **SEOptimer** | Audit API + widget | 70+ audit checks, embeddable widget, white-label PDF reports, CRM integrations, SEO Audit API | ~$19-99/mo | SEO-focused, no email outreach built-in |
| **QA flow** | QA platform | One-click audit (SEO + a11y + perf + security), Jira/Linear export, AI test generation | $49/mo+ | No outreach/CRM pipeline, dev-focused |

### Our Unique Position

Ни один конкурент не объединяет:
1. **AI-powered QA audit** (не только SEO, а UX/accessibility/performance/security)
2. **Lead pipeline с автоматизацией outreach** (audit → email → follow-up)
3. **Self-service scan widget** (посетитель сканирует сайт → мы получаем лида)

**My Web Audit** ближе всех, но они: (a) не делают QA-аудит (только marketing/SEO), (b) нет self-service формы, (c) нет AI-генерации отчётов.

**Наша ниша:** QA Audit as a Lead Generation tool — автоматизированный QA аудит сайтов с конвертацией результатов в продажи.

---

## 2. Текущее состояние — аудит

### Что работает хорошо

- Solid data model (companies → reports → findings + scan_requests + email_templates)
- Public scan widget с real-time статусом (`/scan` → `/scan/status/[id]`)
- Client portal с tracking просмотров (`/r/[code]`)
- Admin CRUD для reports, templates, scan queue
- Lead pipeline с автоматической классификацией (need_followup/active/converted/stale)
- Dark/light theme, responsive sidebar, consistent design system

### Критические пробелы

| # | Gap | Impact | Competitor Benchmark |
|---|-----|--------|---------------------|
| G1 | **Email не отправляется** — шаблоны есть, но "Mark as Sent" не шлёт email | Core value proposition broken | MWA: встроенная email automation |
| G2 | **Нет Report creation flow** — отчёты создаются только через внешний скрипт | Admin не может запустить аудит | MWA: one-click audit в Chrome extension |
| G3 | **Silent failures** — все actions fail silently, нет toast/error UI | Пользователь не знает что сломалось | Industry standard: toast notifications |
| G4 | **Нет пагинации/поиска** — все таблицы грузят всё без лимита | Сломается при 100+ записях | All competitors: pagination + search |
| G5 | **Scan queue read-only** — нельзя retry/cancel/manage сканы | Admin бессилен при ошибках | QA flow: full scan management |
| G6 | **Нет company detail page** — один лид = одна ссылка на последний отчёт | Теряется история взаимодействий | CRM standard: company timeline |
| G7 | **Activity log не пишется** — таблица есть, данных нет | Dashboard показывает mock data | MWA: full activity tracking |
| G8 | **Нет bulk actions** — нет массовой отправки/экспорта | Масштабирование невозможно | SEOptimer: bulk audit + export |

### Баги и tech debt

| # | Bug | Severity |
|---|-----|----------|
| B1 | Template form "Saving..." зависает при ошибке action | Medium |
| B2 | Scan status polling interval не чистится при unmount | Medium |
| B3 | Report detail `setCopied` timeout fires on unmounted component | Low |
| B4 | Mock data на Dashboard показывается без предупреждения | Medium |
| B5 | `getRawClient()` дублируется в 2 файлах | Low (tech debt) |
| B6 | `formatDate()` дублируется в scans и templates | Low (tech debt) |
| B7 | Type safety: untyped Supabase client в actions ("to avoid conflicts") | Medium |

---

## 3. Стратегия улучшений

### Принцип: From Demo to Product

Текущая админка — **working demo**. Чтобы стать **product**, нужно пройти 3 фазы:

### Phase 1: Foundation (Polish & Reliability)
**Цель:** Всё что есть — работает надёжно.

| Task | Priority | Effort |
|------|----------|--------|
| 1.1 Toast notifications (sonner) для всех actions | P0 | 2h |
| 1.2 Fix bugs B1-B3 (template form, polling cleanup, timeout) | P0 | 1h |
| 1.3 Loading states (Suspense boundaries + skeletons) | P1 | 2h |
| 1.4 Confirmation dialogs для деструктивных actions | P1 | 1h |
| 1.5 Пагинация + поиск для Reports и Leads | P1 | 3h |
| 1.6 Убрать mock data fallback, показывать empty states | P1 | 1h |
| 1.7 Fix tech debt: extract shared utils, fix types | P2 | 2h |

**Deliverable:** Robust admin panel, zero silent failures.

### Phase 2: Core Pipeline (Audit → Email → Track)
**Цель:** Полный цикл: scan → report → email → track response.

| Task | Priority | Effort |
|------|----------|--------|
| 2.1 **Email integration** (Resend) — send template to lead from admin | P0 | 4h |
| 2.2 **Scan → Report automation** (n8n webhook → Claude audit → save report) | P0 | 6h |
| 2.3 **Scan queue management** — retry/cancel/re-run actions | P1 | 2h |
| 2.4 **Company detail page** — all reports + activity timeline | P1 | 3h |
| 2.5 **Activity log write** — log all admin actions automatically | P1 | 2h |
| 2.6 **Dashboard real data** — replace mocks, add date range filter | P2 | 3h |

**Deliverable:** End-to-end pipeline: scan website → generate report → send email → track opens/replies.

### Phase 3: Scale & Differentiate
**Цель:** Конкурентные преимущества, которых нет у других.

| Task | Priority | Effort |
|------|----------|--------|
| 3.1 **Embeddable scan widget** (iframe/script для сайтов клиентов) | P1 | 4h |
| 3.2 **White-label reports** (custom branding per client) | P1 | 3h |
| 3.3 **Bulk operations** — mass scan, mass email, CSV export | P1 | 4h |
| 3.4 **Email sequences** (auto follow-up: Day 1 → Day 3 → Day 7) | P2 | 6h |
| 3.5 **Realtime updates** (Supabase Realtime for scan queue + dashboard) | P2 | 3h |
| 3.6 **Analytics dashboard** (charts: scans/day, conversion trends, top domains) | P2 | 4h |
| 3.7 **Webhook/API** для внешних интеграций (Zapier, n8n, CRM) | P2 | 4h |
| 3.8 **Multi-user + roles** (admin/viewer/operator) | P3 | 6h |

**Deliverable:** Scalable SaaS product с unique selling points.

---

## 4. Competitive Advantage Matrix

| Feature | Us (Now) | Us (Phase 3) | MWA | MSA | SEOptimer | QA flow |
|---------|----------|--------------|-----|-----|-----------|---------|
| QA/UX audit (not just SEO) | Yes | Yes | No | No | No | Yes |
| AI-generated reports | Yes | Yes | Yes | No | No | Yes |
| Self-service scan widget | Yes | Yes + embed | No | Yes | Yes | No |
| Email outreach pipeline | No | Yes | Yes | No | Partial | No |
| Auto follow-up sequences | No | Yes | Yes | No | No | No |
| Lead pipeline/CRM | Basic | Full | No | No | Basic | No |
| White-label reports | No | Yes | Yes | Yes | Yes | No |
| Embeddable widget | No | Yes | No | Yes | Yes | No |
| Webhook/API | No | Yes | Zapier | No | API | Jira/Linear |
| Client portal with tracking | Yes | Yes | No | No | No | No |

**After Phase 3, мы покрываем все фичи конкурентов + уникальная комбинация QA + Outreach.**

---

## 5. Рекомендация

**Начать с Phase 1** — это 12 часов работы, которые превращают demo в reliable product. Без этого Phase 2 бессмысленна (email будет fail silently, пользователь не узнает).

**Phase 2 — ключевая.** Email integration + scan automation — это MVP полного цикла. Без этого у нас "красивая витрина" без бизнес-логики.

**Phase 3 — дифференциация.** Embeddable widget + white-label + sequences — это то, за что платят SaaS customers.

---

## Sources

- [My Web Audit — Features](https://www.mywebaudit.com/features)
- [My Web Audit — Pricing](https://www.mywebaudit.com/pricing)
- [MySiteAuditor — Embeddable Tool](https://mysiteauditor.com/tour)
- [SEOptimer — Embeddable Widget](https://www.seoptimer.com/embeddable-audit-tool/)
- [SEOptimer — SEO Audit API](https://www.seoptimer.com/seo-api/)
- [QA flow — Website Audit](https://www.qaflow.com/website-audit)
- [SaaS Dashboard UX Patterns 2026](https://www.saasframe.io/blog/the-anatomy-of-high-performance-saas-dashboard-design-2026-trends-patterns)
- [Cold Email for SaaS 2026](https://www.saleshandy.com/blog/saas-cold-email/)
- [SaaS UX Best Practices](https://www.letsgroto.com/blog/saas-ux-best-practices-how-to-design-dashboards-users-actually-understand)
