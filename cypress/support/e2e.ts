import './commands';

const topWindow = window.top as Window & typeof globalThis;
if (topWindow && topWindow.console) {
  const origLog = topWindow.console.log.bind(topWindow.console);
  topWindow.console.log = (...args: unknown[]) => {
    try {
      const msg = args.map((a) => String(a)).join(' ');
      // Фильтровать по шаблону — пример: очень длинные XHR payloads или специфичные сообщения
      if (msg.length > 2000 || /XHR:|Fetch:/.test(msg)) {
        // опционально: отправлять в Cypress.log для анализа
        // Cypress.log({ name: 'silent-log', message: msg.slice(0, 300) });
        return; // подавляем чрезмерно длинный/шумный вывод
      }
    } catch {
      // если что-то пошло не так, не мешаем обычному логированию
    }
    // оставляем полезные логи как есть
    origLog(...args);
  };
}

// Prefer filtering only known harmless uncaught exceptions instead of swallowing all.
Cypress.on('uncaught:exception', (err) => {
  const msg = (err && (err.message || err.toString())) ?? '';
  // Добавьте сюда шаблоны ошибок, которые вы действительно хотите игнорировать:
  const ignoredPatterns = [
    /ResizeObserver loop limit exceeded/i,
    /IgnoredNonCriticalErrorExample/i,
  ];
  if (ignoredPatterns.some((rx) => rx.test(String(msg)))) {
    return false; // игнорируем конкретную, ожидаемую ошибку
  }
  // Для всех прочих исключений — позволим тесту упасть (вернёт true),
  // чтобы реальные ошибки не проскочили незамеченными.
  return true;
});
