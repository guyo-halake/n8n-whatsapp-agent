const https = require('https');

https.get('https://p133-caldav.icloud.com/published/2/MjE0NjgyMTc1NDQyMTQ2OEFsTaOMgZOnjo_eiajsXAfXKu2fcxXZTkELSLHDssc2gSMeo6LcBNqvxzrguhygL6C1pNypIWMfYp-tvku8-Z0', (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}${month}${day}`;
    const dayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const todayDayCode = dayCodes[now.getDay()];

    const lines = raw.split(/\r?\n/);
    const events = [];
    let cur = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === 'BEGIN:VEVENT') {
        cur = {};
      } else if (trimmed === 'END:VEVENT' && cur) {
        if (cur.summary) events.push(cur);
        cur = null;
      } else if (cur) {
        if (trimmed.startsWith('SUMMARY:')) {
          cur.summary = trimmed.substring(8);
        } else if (trimmed.includes('DTSTART')) {
          cur.dtstart = trimmed.split(':').pop();
        } else if (trimmed.includes('DTEND')) {
          cur.dtend = trimmed.split(':').pop();
        } else if (trimmed.startsWith('RRULE:')) {
          cur.rrule = trimmed.substring(6);
        }
      }
    }

    const todayClasses = [];
    for (const e of events) {
      const dt = e.dtstart || '';
      const isByDay = new RegExp(`BYDAY=[^;]*\\b${todayDayCode}\\b`).test(e.rrule || '');
      const isTodayDate = dt.startsWith(todayStr);
      
      if (isTodayDate || isByDay) {
        let timeStr = '';
        if (dt.includes('T')) {
          const t = dt.split('T')[1];
          timeStr = `${t.slice(0, 2)}:${t.slice(2, 4)} EAT`;
        }
        todayClasses.push(`${e.summary}${timeStr ? ' (' + timeStr + ')' : ''}`);
      }
    }

    const uniqueClasses = [...new Set(todayClasses)];
    console.log('Today date:', todayStr, 'Day code:', todayDayCode);
    console.log('Parsed today classes:', uniqueClasses);
  });
});
