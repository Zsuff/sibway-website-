# Deployment guide

Цей репозиторій містить лише runtime-код статичного сайту (HTML, CSS,
JavaScript, assets) для мовних версій `/uk/`, `/en/`, `/pl/`. Він не
містить вимог, бізнес-документації, релізних архівів чи хостингових
доступів.

## Нормативні правила

Повна release/deployment-policy веде́ться в репозиторії вимог:
`https://github.com/Zsuff/sibway-logistics-website/tree/main/docs`

Перед роботою обов'язково прочитати там:

- `docs/CLAUDE.md`;
- `docs/RULES.md`;
- `docs/DEPLOYMENT.md`.

`docs/CLAUDE.md` у репозиторії вимог лишається єдиною нормативною
інструкцією для Claude Code.

## Deployable unit

Одиниця деплою — точний approved commit SHA цього репозиторію, а не
стан робочої директорії. Uncommitted зміни не деплояться.

## Lifecycle (коротко)

```text
локальна зміна → локальна валідація → приймання власником →
commit/push → preview deploy → QA → production approval/deploy
```

Деталі кожного кроку — у `docs/DEPLOYMENT.md` репозиторію вимог.

## Заборони

- без ручних правок коду безпосередньо на хостингу;
- без деплою з uncommitted стану;
- без production deploy без попереднього preview acceptance;
- без secrets, release-архівів чи backup-файлів у Git цього
  репозиторію;
- без automatic deploy або SFTP remote write без окремого явного
  дозволу власника.

## Середовища

- Preview: `https://preview.sibway.com.ua` — захищений Basic Auth;
  Basic Auth не вимикається без окремого дозволу власника.
- Production: `https://sibway.com.ua`.

## Перед commit

```bash
git diff --check
git diff --stat
git status --short
```

Плюс релевантні QA-перевірки (responsive, accessibility, Console/
Network, UA/EN/PL parity, SEO за потреби) — деталі в `docs/DEPLOYMENT.md`
репозиторію вимог.

## Після зміни

Звіт містить:

1. список змінених файлів;
2. перевірки, які були виконані;
3. відомі ризики;
4. наступний крок.
