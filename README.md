Многостраничное React + TypeScript приложение — конструктор и заказчик бургеров.  
README описывает архитектуру, компоненты, тесты, CI и рекомендации для разработки и деплоя.

---

## Содержание
- О проекте
- Фичи
- Технологии
- Быстрый старт (локально)
- Переменные окружения
- Скрипты (npm)
- Структура репозитория и ключевые файлы
- Компоненты и страницы — что за что отвечает
- Состояние и фичи (Redux)
- API, WebSocket и сервисы
- Тестирование
  - unit (Jest)
  - e2e (Cypress)
  - покрытие (coverage)
- Storybook
- CI (GitHub Actions)
- Рекомендации по внесению изменений / написанию тестов
- Troubleshooting & FAQ
- Как внести вклад

---

## О проекте
Stellar Burgers — учебный/демонстрационный проект, демонстрирующий:
- SPA c React + TypeScript
- маршрутизацию (React Router v6)
- управление состоянием через Redux Toolkit (slices & thunks)
- работу с REST API и WebSocket (лента заказов, профильные заказы)
- юнит- и e2e‑тестирование (Jest, Testing Library, Cypress)
- UI-компоненты и сторибук

---

## Фичи
- Конструктор бургеров (перетаскивание/выбор ингредиентов)
- Оформление заказа (создание заказа на сервере)
- Авторизация, регистрация и восстановление пароля
- Защищённые маршруты для профиля и истории заказов
- Лента заказов (все пользователи) + история текущего пользователя (WebSocket)
- Модальные окна с подробностями ингредиентов и заказов
- Storybook для UI-компонентов

---

## Технологии
- React 18, TypeScript
- Redux Toolkit, react-redux, redux-thunk
- React Router v6
- Webpack dev server
- Jest + ts-jest + @testing-library/react
- Cypress (E2E)
- Storybook
- WebSocket (для реальной/моковой ленты заказов)

---

## Быстрый старт (локально)
1. Установить зависимости:
npm ci

2. Создать `.env` на основе `.env.example` и указать `BURGER_API_URL` (см. раздел ниже).

3. Запустить dev‑сервер:
npm start

4. Открыть Storybook (опционально):
npm run storybook

5. Запустить Jest (unit):
npm test
# или интерактивно
npm run test:watch

6. Запустить покрытие:
npm run coverage
# для просмотра отчёта:
Start-Process .\coverage\lcov-report\index.html

7. Cypress (E2E):
npm run cypress:open
# или headless
npm run cypress:run

---

## Переменные окружения
- `BURGER_API_URL` — базовый URL API сервера (например: https://norma.nomoreparties.space/api).
Добавьте в `.env`:
BURGER_API_URL=http://localhost:3001

(Если в репозитории есть `.env.example`, используйте его как шаблон.)

---
