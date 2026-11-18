// PulseTrade Live - NSE Trading Calendar & Weekend/Holiday Manager

class NSECalendarManager {
  constructor() {
    // Real-world NSE Calendar Mode by default (false = enforce strict real-world market hours & weekend closures)
    this.isSimulatorMode = localStorage.getItem('pulsetrade_nse_simulator_mode') === 'true';
    
    // Official NSE Trading Holidays List (2026 & 2025)
    this.holidays = [
      { date: "2026-01-26", name: "Republic Day", day: "Monday" },
      { date: "2026-02-17", name: "Mahashivratri", day: "Tuesday" },
      { date: "2026-03-03", name: "Holi", day: "Tuesday" },
      { date: "2026-03-20", name: "Id-Ul-Fitr (Ramzan Id)", day: "Friday" },
      { date: "2026-04-03", name: "Good Friday", day: "Friday" },
      { date: "2026-04-14", name: "Dr. B.R. Ambedkar Jayanti", day: "Tuesday" },
      { date: "2026-05-01", name: "Maharashtra Day", day: "Friday" },
      { date: "2026-05-27", name: "Bakri Id / Eid ul-Adha", day: "Wednesday" },
      { date: "2026-06-25", name: "Muharram", day: "Thursday" },
      { date: "2026-08-15", name: "Independence Day", day: "Saturday" },
      { date: "2026-09-04", name: "Milad-un-Nabi", day: "Friday" },
      { date: "2026-10-02", name: "Mahatma Gandhi Jayanti", day: "Friday" },
      { date: "2026-10-20", name: "Dussehra", day: "Tuesday" },
      { date: "2026-11-08", name: "Diwali Laxmi Pujan (Muhurat Trading only)", day: "Sunday" },
      { date: "2026-11-10", name: "Diwali Balipratipada", day: "Tuesday" },
      { date: "2026-11-24", name: "Gurunanak Jayanti", day: "Tuesday" },
      { date: "2026-12-25", name: "Christmas", day: "Friday" }
    ];

    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.getMarketStatus()));
  }

  toggleSimulatorMode() {
    this.isSimulatorMode = !this.isSimulatorMode;
    localStorage.setItem('pulsetrade_nse_simulator_mode', this.isSimulatorMode.toString());
    if (window.arcadeAudio) window.arcadeAudio.playBlip();
    if (window.showAppToast) {
      window.showAppToast({
        title: this.isSimulatorMode ? "Practice Simulator Enabled" : "Real-World Calendar Active",
        message: this.isSimulatorMode
          ? "Live weekend market simulation active. Practice intraday setups anytime!"
          : "Enforcing strict real-world NSE Saturday/Sunday & Holiday closure rules.",
        type: "info"
      });
    }
    this.notify();
    if (window.app) window.app.renderActiveScreen();
  }

  // Check if given date is Saturday or Sunday
  isWeekend(date = new Date()) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  // Check if given date is in official NSE holiday list
  getHoliday(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return this.holidays.find(h => h.date === dateStr) || null;
  }

  // Calculate current real-world market status vs simulated
  getMarketStatus() {
    const now = new Date();
    const isWknd = this.isWeekend(now);
    const holiday = this.getHoliday(now);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Normal NSE Trading hours (09:00 - 15:30 IST)
    const isWithinHours = totalMinutes >= 9 * 60 && totalMinutes <= 15 * 60 + 30;

    const realWorldClosed = isWknd || Boolean(holiday) || !isWithinHours;
    let reason = '';
    if (isWknd) reason = `WEEKEND (${dayName.toUpperCase()})`;
    else if (holiday) reason = `PUBLIC HOLIDAY (${holiday.name})`;
    else if (!isWithinHours) reason = totalMinutes < 540 ? 'PRE-MARKET (OPENS 09:00)' : 'POST-MARKET (CLOSED 15:30)';

    // In simulator mode, treat market as active session for practice
    const effectiveOpen = this.isSimulatorMode ? true : !realWorldClosed;

    return {
      isOpen: effectiveOpen,
      isRealWorldClosed: realWorldClosed,
      realReason: reason,
      isWeekend: isWknd,
      isHoliday: Boolean(holiday),
      holidayDetails: holiday,
      dayName,
      inSimulatorMode: this.isSimulatorMode,
      nextSessionDate: isWknd ? 'Monday 09:00 IST' : (totalMinutes > 930 ? 'Tomorrow 09:00 IST' : 'Today 09:00 IST'),
      holidaysList: this.holidays
    };
  }
}

window.nseCalendar = new NSECalendarManager();
