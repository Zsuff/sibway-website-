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
локальна зміна (MacBook власника) → локальна валідація → приймання
власником → commit/push → PR → код-рев'ю → merge у main →
SFTP-деплой (FileZilla) на вже автентифікованій сесії власника —
виконує власник особисто або Claude Code через computer-use,
за окремим дозволом на цей конкретний деплой
```

Деталі кожного кроку — у `docs/DEPLOYMENT.md` репозиторію вимог.

## Заборони

- без ручних правок коду безпосередньо на хостингу;
- без деплою з uncommitted стану;
- без production deploy без окремого дозволу власника на цей deploy;
- без secrets, release-архівів чи backup-файлів у Git цього
  репозиторію;
- без automatic deploy або SFTP remote write без окремого явного
  дозволу власника.

## Середовища

- Production: `https://sibway.com.ua` — публікація через SFTP
  (FileZilla) на вже автентифікованій сесії власника; виконує власник
  особисто або, за окремим явним дозволом на кожен конкретний деплой,
  Claude Code через computer-use. Hosting credentials Claude Code не
  отримує й не зберігає в жодному разі.

`preview.sibway.com.ua` видалено власником і більше не існує; окремого
staging/QA-середовища між `main` і production немає.

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
