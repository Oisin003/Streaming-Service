import React, { useState, useEffect } from 'react';
import './HolidayCard.css';

const HolidayCard = () => {
  const [holiday, setHoliday] = useState(null);

  // Holiday definitions with dates and messages
  const holidays = [
    {
      name: "New Year's Day",
      month: 0, // January
      day: 1,
      emoji: "🎆",
      message: "Happy New Year!",
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      animation: "sparkle"
    },
    {
      name: "Australia Day",
      month: 0, // January
      day: 26,
      emoji: "🇦🇺",
      message: "Happy Australia Day!",
      backgroundColor: "linear-gradient(135deg, #00b894 0%, #fdcb6e 100%)",
      animation: "bounce"
    },
    {
      name: "Republic Day (India)",
      month: 0, // January
      day: 26,
      emoji: "🇮🇳",
      message: "Happy Republic Day!",
      backgroundColor: "linear-gradient(135deg, #ff7675 0%, #fdcb6e 50%, #00b894 100%)",
      animation: "sparkle"
    },
    {
      name: "Chinese New Year",
      month: 1, // February (approximate - varies)
      day: 10,
      emoji: "🐉",
      message: "Happy Chinese New Year!",
      backgroundColor: "linear-gradient(135deg, #eb3b5a 0%, #fc5c65 100%)",
      animation: "sparkle"
    },
    {
      name: "Valentine's Day",
      month: 1, // February
      day: 14,
      emoji: "💝",
      message: "Happy Valentine's Day!",
      backgroundColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      animation: "hearts"
    },
    {
      name: "Mardi Gras",
      month: 1, // February (approximate - varies)
      day: 25,
      emoji: "🎭",
      message: "Happy Mardi Gras!",
      backgroundColor: "linear-gradient(135deg, #a55eea 0%, #feca57 50%, #48dbfb 100%)",
      animation: "bounce"
    },
    {
      name: "International Women's Day",
      month: 2, // March
      day: 8,
      emoji: "👩",
      message: "Happy International Women's Day!",
      backgroundColor: "linear-gradient(135deg, #ee5a6f 0%, #f29263 100%)",
      animation: "sparkle"
    },
    {
      name: "St. Patrick's Day",
      month: 2, // March
      day: 17,
      emoji: "☘️",
      message: "Happy St. Patrick's Day!",
      backgroundColor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      animation: "bounce"
    },
    {
      name: "Holi",
      month: 2, // March (approximate - varies)
      day: 25,
      emoji: "🎨",
      message: "Happy Holi!",
      backgroundColor: "linear-gradient(135deg, #fa4659 0%, #fee140 33%, #1dd1a1 66%, #5f27cd 100%)",
      animation: "sparkle"
    },
    {
      name: "Nowruz (Persian New Year)",
      month: 2, // March
      day: 21,
      emoji: "🌸",
      message: "Happy Nowruz!",
      backgroundColor: "linear-gradient(135deg, #a8e6cf 0%, #ffd3b6 100%)",
      animation: "bounce"
    },
    {
      name: "Easter",
      month: 3, // April (approximate - varies)
      day: 20,
      emoji: "🐰",
      message: "Happy Easter!",
      backgroundColor: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      animation: "hop"
    },
    {
      name: "Earth Day",
      month: 3, // April
      day: 22,
      emoji: "🌍",
      message: "Happy Earth Day!",
      backgroundColor: "linear-gradient(135deg, #0be881 0%, #0fbcf9 100%)",
      animation: "bounce"
    },
    {
      name: "Songkran (Thai New Year)",
      month: 3, // April
      day: 13,
      emoji: "💧",
      message: "Happy Songkran!",
      backgroundColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      animation: "sparkle"
    },
    {
      name: "St. George's Day",
      month: 3, // April
      day: 23,
      emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      message: "Happy St. George's Day!",
      backgroundColor: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
      animation: "bounce"
    },
    {
      name: "Anzac Day",
      month: 3, // April
      day: 25,
      emoji: "🌺",
      message: "Lest We Forget - Anzac Day",
      backgroundColor: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
      animation: "fade"
    },
    {
      name: "King's Day (Netherlands)",
      month: 3, // April
      day: 27,
      emoji: "🇳🇱",
      message: "Happy King's Day!",
      backgroundColor: "linear-gradient(135deg, #ff6348 0%, #ff9ff3 100%)",
      animation: "bounce"
    },
    {
      name: "May Day",
      month: 4, // May
      day: 1,
      emoji: "🌺",
      message: "Happy May Day!",
      backgroundColor: "linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)",
      animation: "sparkle"
    },
    {
      name: "Cinco de Mayo",
      month: 4, // May
      day: 5,
      emoji: "🇲🇽",
      message: "Feliz Cinco de Mayo!",
      backgroundColor: "linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #ee0979 100%)",
      animation: "bounce"
    },
    {
      name: "Mother's Day",
      month: 4, // May (2nd Sunday - approximate)
      day: 10,
      emoji: "💐",
      message: "Happy Mother's Day!",
      backgroundColor: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      animation: "hearts"
    },
    {
      name: "Father's Day",
      month: 5, // June (3rd Sunday - approximate)
      day: 21,
      emoji: "👨",
      message: "Happy Father's Day!",
      backgroundColor: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
      animation: "bounce"
    },
    {
      name: "Canada Day",
      month: 6, // July
      day: 1,
      emoji: "🇨🇦",
      message: "Happy Canada Day!",
      backgroundColor: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)",
      animation: "sparkle"
    },
    {
      name: "Independence Day (USA)",
      month: 6, // July
      day: 4,
      emoji: "🎆",
      message: "Happy 4th of July!",
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)",
      animation: "sparkle"
    },
    {
      name: "Bastille Day",
      month: 6, // July
      day: 14,
      emoji: "🇫🇷",
      message: "Joyeux 14 Juillet!",
      backgroundColor: "linear-gradient(135deg, #0052cc 0%, #ffffff 50%, #ed2939 100%)",
      animation: "sparkle"
    },
    {
      name: "International Friendship Day",
      month: 6, // July
      day: 30,
      emoji: "🤝",
      message: "Happy Friendship Day!",
      backgroundColor: "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
      animation: "hearts"
    },
    {
      name: "Oktoberfest Start",
      month: 8, // September (mid-late month)
      day: 20,
      emoji: "🍺",
      message: "Prost! Happy Oktoberfest!",
      backgroundColor: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
      animation: "bounce"
    },
    {
      name: "Mid-Autumn Festival",
      month: 8, // September (approximate - varies)
      day: 29,
      emoji: "🥮",
      message: "Happy Mid-Autumn Festival!",
      backgroundColor: "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)",
      animation: "sparkle"
    },
    {
      name: "Halloween",
      month: 9, // October
      day: 31,
      emoji: "🎃",
      message: "Happy Halloween!",
      backgroundColor: "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)",
      animation: "spooky"
    },
    {
      name: "Day of the Dead",
      month: 10, // November
      day: 2,
      emoji: "💀",
      message: "Feliz Día de los Muertos!",
      backgroundColor: "linear-gradient(135deg, #fa4659 0%, #fee140 50%, #a855f7 100%)",
      animation: "sparkle"
    },
    {
      name: "Guy Fawkes Night",
      month: 10, // November
      day: 5,
      emoji: "🎆",
      message: "Remember, Remember the 5th of November!",
      backgroundColor: "linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)",
      animation: "sparkle"
    },
    {
      name: "Diwali",
      month: 10, // November (approximate - varies)
      day: 12,
      emoji: "🪔",
      message: "Happy Diwali!",
      backgroundColor: "linear-gradient(135deg, #fa8231 0%, #ffd89b 50%, #19547b 100%)",
      animation: "sparkle"
    },
    {
      name: "Remembrance Day",
      month: 10, // November
      day: 11,
      emoji: "🌺",
      message: "Lest We Forget",
      backgroundColor: "linear-gradient(135deg, #d31027 0%, #ea384d 100%)",
      animation: "fade"
    },
    {
      name: "Thanksgiving",
      month: 10, // November (4th Thursday - approximate)
      day: 28,
      emoji: "🦃",
      message: "Happy Thanksgiving!",
      backgroundColor: "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
      animation: "fade"
    },
    {
      name: "Hanukkah",
      month: 11, // December (approximate - varies)
      day: 22,
      emoji: "🕎",
      message: "Happy Hanukkah!",
      backgroundColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      animation: "sparkle"
    },
    {
      name: "Christmas Eve",
      month: 11, // December
      day: 24,
      emoji: "🎄",
      message: "Merry Christmas Eve!",
      backgroundColor: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
      animation: "snow"
    },
    {
      name: "Christmas",
      month: 11, // December
      day: 25,
      emoji: "🎅",
      message: "Merry Christmas!",
      backgroundColor: "linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)",
      animation: "snow"
    },
    {
      name: "Boxing Day",
      month: 11, // December
      day: 26,
      emoji: "🎁",
      message: "Happy Boxing Day!",
      backgroundColor: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
      animation: "bounce"
    },
    {
      name: "Kwanzaa",
      month: 11, // December
      day: 26,
      emoji: "🕯️",
      message: "Happy Kwanzaa!",
      backgroundColor: "linear-gradient(135deg, #e43a15 0%, #e65245 50%, #1a2a6c 100%)",
      animation: "sparkle"
    },
    {
      name: "New Year's Eve",
      month: 11, // December
      day: 31,
      emoji: "🎉",
      message: "Happy New Year's Eve!",
      backgroundColor: "linear-gradient(135deg, #ffa585 0%, #ffeda0 100%)",
      animation: "sparkle"
    }
  ];

  // Check for current holiday
  useEffect(() => {
    const checkHoliday = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();

      // Find matching holiday
      const todaysHoliday = holidays.find(
        h => h.month === currentMonth && h.day === currentDay
      );

      if (todaysHoliday) {
        setHoliday(todaysHoliday);
      }
    };

    checkHoliday();
  }, []);

  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!holiday || !isVisible) return null;

  return (
    <div className="holiday-overlay">
      <div 
        className={`holiday-card ${holiday.animation}`}
        style={{ background: holiday.backgroundColor }}
      >
        <button className="holiday-close" onClick={handleClose}>×</button>
        <div className="holiday-emoji">{holiday.emoji}</div>
        <h2 className="holiday-message">{holiday.message}</h2>
        <p className="holiday-subtitle">From all of us at Streaming Service</p>
        
        {/* Decorative elements based on animation type */}
        {holiday.animation === 'snow' && (
          <div className="snowflakes" aria-hidden="true">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="snowflake">❅</div>
            ))}
          </div>
        )}
        
        {holiday.animation === 'hearts' && (
          <div className="hearts-container" aria-hidden="true">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="floating-heart">💗</div>
            ))}
          </div>
        )}
        
        {holiday.animation === 'sparkle' && (
          <div className="sparkles" aria-hidden="true">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="sparkle">✨</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayCard;
