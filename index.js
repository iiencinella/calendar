!(function () {
  var today = moment();

  function Calendar(selector, events) {
    this.el = document.querySelector(selector);
    this.events = events;
    this.current = moment().date(1);
    this.draw();
    var current = document.querySelector(".today");
    if (current) {
      var self = this;
      window.setTimeout(function () {
        self.openDay(current);
      }, 500);
    }
  }

  Calendar.prototype.draw = function () {
    //Create Header
    this.drawHeader();

    //Draw Month
    this.drawMonth();

    this.drawLegend();
  };

  Calendar.prototype.drawHeader = function () {
    var self = this;
    if (!this.header) {
      //Create the header elements
      this.header = createElement("div", "header");
      this.header.className = "header";

      this.title = createElement("h1");

      var right = createElement("div", "right");
      right.addEventListener("click", function () {
        self.nextMonth();
      });

      var left = createElement("div", "left");
      left.addEventListener("click", function () {
        self.prevMonth();
      });

      //Append the Elements
      this.header.appendChild(this.title);
      this.header.appendChild(right);
      this.header.appendChild(left);
      this.el.appendChild(this.header);
    }

    this.title.innerHTML = this.current.format("MMMM YYYY");
  };

  Calendar.prototype.drawMonth = function () {
    var self = this;

    this.events.forEach(function (ev) {
      // ev.date = self.current.clone().date(Math.random() * (29 - 1) + 1);
      ev.date = moment(ev.day).clone();
    });

    if (this.month) {
      this.oldMonth = this.month;
      this.oldMonth.className = "month out " + (self.next ? "next" : "prev");
      this.oldMonth.addEventListener("webkitAnimationEnd", function () {
        self.oldMonth.parentNode.removeChild(self.oldMonth);
        self.month = createElement("div", "month");
        self.backFill();
        self.currentMonth();
        self.fowardFill();
        self.el.appendChild(self.month);
        window.setTimeout(function () {
          self.month.className = "month in " + (self.next ? "next" : "prev");
        }, 16);
      });
    } else {
      this.month = createElement("div", "month");
      this.el.appendChild(this.month);
      this.backFill();
      this.currentMonth();
      this.fowardFill();
      this.month.className = "month new";
    }
  };

  Calendar.prototype.backFill = function () {
    var clone = this.current.clone();
    var dayOfWeek = clone.day();

    if (!dayOfWeek) {
      return;
    }

    clone.subtract("days", dayOfWeek + 1);

    for (var i = dayOfWeek; i > 0; i--) {
      this.drawDay(clone.add("days", 1));
    }
  };

  Calendar.prototype.fowardFill = function () {
    var clone = this.current.clone().add("months", 1).subtract("days", 1);
    var dayOfWeek = clone.day();

    if (dayOfWeek === 6) {
      return;
    }

    for (var i = dayOfWeek; i < 6; i++) {
      this.drawDay(clone.add("days", 1));
    }
  };

  Calendar.prototype.currentMonth = function () {
    var clone = this.current.clone();

    while (clone.month() === this.current.month()) {
      this.drawDay(clone);
      clone.add("days", 1);
    }
  };

  Calendar.prototype.getWeek = function (day) {
    if (!this.week || day.day() === 0) {
      this.week = createElement("div", "week");
      this.month.appendChild(this.week);
    }
  };

  Calendar.prototype.drawDay = function (day) {
    var self = this;
    this.getWeek(day);

    //Outer Day
    var outer = createElement("div", this.getDayClass(day));
    outer.addEventListener("click", function () {
      self.openDay(this);
    });

    //Day Name
    var name = createElement("div", "day-name", day.format("ddd"));

    //Day Number
    var number = createElement("div", "day-number", day.format("DD"));

    //Events
    var events = createElement("div", "day-events");
    this.drawEvents(day, events);

    outer.appendChild(name);
    outer.appendChild(number);
    outer.appendChild(events);
    this.week.appendChild(outer);
  };

  Calendar.prototype.drawEvents = function (day, element) {
    const church = document.getElementById('churchs').value;
    if (day.month() === this.current.month()) {
      var todaysEvents = this.events.reduce(function (memo, ev) {
        if (ev.church === church && ev.date.isSame(day, "day") && ev.date.isSame(day, "month")) {
          memo.push(ev);
        }
        return memo;
      }, []);

      todaysEvents.forEach(function (ev) {
        var evSpan = createElement("span", ev.color);
        element.appendChild(evSpan);
      });
    }
  };

  Calendar.prototype.getDayClass = function (day) {
    classes = ["day"];
    if (day.month() !== this.current.month()) {
      classes.push("other");
    } else if (today.isSame(day, "day")) {
      classes.push("today");
    }
    return classes.join(" ");
  };

  Calendar.prototype.openDay = function (el) {
    var details, arrow;
    var dayNumber =
      +el.querySelectorAll(".day-number")[0].innerText ||
      +el.querySelectorAll(".day-number")[0].textContent;
    var day = this.current.clone().date(dayNumber);

    var currentOpened = document.querySelector(".details");

    //Check to see if there is an open detais box on the current row
    if (currentOpened && currentOpened.parentNode === el.parentNode) {
      details = currentOpened;
      arrow = document.querySelector(".arrow");
    } else {
      //Close the open events on differnt week row
      //currentOpened && currentOpened.parentNode.removeChild(currentOpened);
      if (currentOpened) {
        currentOpened.addEventListener("webkitAnimationEnd", function () {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener("oanimationend", function () {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener("msAnimationEnd", function () {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener("animationend", function () {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.className = "details out";
      }

      //Create the Details Container
      details = createElement("div", "details in");

      //Create the arrow
      var arrow = createElement("div", "arrow");

      //Create the event wrapper

      details.appendChild(arrow);
      el.parentNode.appendChild(details);
    }

    var todaysEvents = this.events.reduce(function (memo, ev) {
      if (ev.date.isSame(day, "day")) {
        memo.push(ev);
      }
      return memo;
    }, []);

    this.renderEvents(todaysEvents, details);

    arrow.style.left = el.offsetLeft - el.parentNode.offsetLeft + 27 + "px";
  };

  Calendar.prototype.renderEvents = function (events, ele) {
    //Remove any events in the current details element
    var currentWrapper = ele.querySelector(".events");
    var wrapper = createElement(
      "div",
      "events in" + (currentWrapper ? " new" : "")
    );

    events.forEach(function (ev) {
      var div = createElement("div", "event");
      var square = createElement("div", "event-category " + ev.color);
      var span = createElement("span", "", ev.eventName);

      div.appendChild(square);
      div.appendChild(span);
      wrapper.appendChild(div);
    });

    if (!events.length) {
      var div = createElement("div", "event empty");
      var span = createElement("span", "", "No Events");

      div.appendChild(span);
      wrapper.appendChild(div);
    }

    if (currentWrapper) {
      currentWrapper.className = "events out";
      currentWrapper.addEventListener("webkitAnimationEnd", function () {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
      currentWrapper.addEventListener("oanimationend", function () {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
      currentWrapper.addEventListener("msAnimationEnd", function () {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
      currentWrapper.addEventListener("animationend", function () {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
    } else {
      ele.appendChild(wrapper);
    }
  };

  Calendar.prototype.drawLegend = function () {
    var legend = createElement("div", "legend");
    var calendars = this.events
      .map(function (e) {
        return e.calendar + "|" + e.color;
      })
      .reduce(function (memo, e) {
        if (memo.indexOf(e) === -1) {
          memo.push(e);
        }
        return memo;
      }, [])
      .forEach(function (e) {
        var parts = e.split("|");
        var entry = createElement("span", "entry " + parts[1], parts[0]);
        legend.appendChild(entry);
      });
    this.el.appendChild(legend);
  };

  Calendar.prototype.nextMonth = function () {
    this.current.add("months", 1);
    this.next = true;
    this.draw();
  };

  Calendar.prototype.prevMonth = function () {
    this.current.subtract("months", 1);
    this.next = false;
    this.draw();
  };

  window.Calendar = Calendar;

  function createElement(tagName, className, innerText) {
    var ele = document.createElement(tagName);
    if (className) {
      ele.className = className;
    }
    if (innerText) {
      ele.innderText = ele.textContent = innerText;
    }
    return ele;
  }
})();

!(function () {
  const data = [
    // Parroquia Santo Domingo Savio
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "07/23/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "07/30/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "08/06/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "08/13/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "08/20/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "08/27/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "09/03/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "09/10/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "09/17/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "09/24/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "10/01/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "10/08/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "10/15/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "10/22/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "10/29/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "11/05/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "11/12/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "11/19/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "11/26/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "12/03/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "12/10/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "12/17/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de niños - 11hs", calendar: "Misa", color: "orange", day: "12/24/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa bendición a embarazadas y aquellas que desean tener un hijo/a (con reliquias de Santo Domingo Savio) - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/06/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa bendición a embarazadas y aquellas que desean tener un hijo/a (con reliquias de Santo Domingo Savio) - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/06/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa bendición a embarazadas y aquellas que desean tener un hijo/a (con reliquias de Santo Domingo Savio) - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/06/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa bendición a embarazadas y aquellas que desean tener un hijo/a (con reliquias de Santo Domingo Savio) - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "11/06/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa bendición a embarazadas y aquellas que desean tener un hijo/a (con reliquias de Santo Domingo Savio) - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/06/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de adoradores y bendición con la reliquia de Santa María Goretti - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/08/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de adoradores y bendición con la reliquia de Santa María Goretti - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/08/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de adoradores y bendición con la reliquia de Santa María Goretti - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/08/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de adoradores y bendición con la reliquia de Santa María Goretti - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "11/08/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa de adoradores y bendición con la reliquia de Santa María Goretti - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/08/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Beato Carlo Acutis - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/12/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Beato Carlo Acutis - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/12/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Beato Carlo Acutis - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/12/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Beato Carlo Acutis - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "11/12/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Beato Carlo Acutis - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/12/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición a los enfermos con la cruz de San Benito - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/14/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición a los enfermos con la cruz de San Benito - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/14/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición a los enfermos con la cruz de San Benito - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/14/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición a los enfermos con la cruz de San Benito - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "11/14/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición a los enfermos con la cruz de San Benito - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/14/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Santo Cura Brochero - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/16/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Santo Cura Brochero - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/16/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Santo Cura Brochero - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/16/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Santo Cura Brochero - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "11/16/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Santo Cura Brochero - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/16/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Padre Pío - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "07/23/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Padre Pío - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/23/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Padre Pío - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/23/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Padre Pío - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/23/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Padre Pío - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "11/23/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de Padre Pío - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/23/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de San Juan Bosco - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/31/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de San Juan Bosco - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/31/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de San Juan Bosco - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/31/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de San Juan Bosco - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "11/31/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa con bendición con la reliquia de San Juan Bosco - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/31/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa por los enfermos y afligidos - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/08/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa por los enfermos y afligidos - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/05/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa por los enfermos y afligidos - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/03/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa por los enfermos y afligidos - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/05/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa a Sagrado Corazón de Jesús y bendición con reliquias de San Peregrino - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "08/04/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa a Sagrado Corazón de Jesús y bendición con reliquias de San Peregrino - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "09/01/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa a Sagrado Corazón de Jesús y bendición con reliquias de San Peregrino - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "10/06/2023", church: 'Santo Domingo Savio' },
    { eventName: "Misa a Sagrado Corazón de Jesús y bendición con reliquias de San Peregrino - Todas las misas del día", calendar: "Misa y bendición con reliquias", color: "green", day: "12/01/2023", church: 'Santo Domingo Savio' },
  ];

  const church = [
    // { name: 'Catedral Nuestra Señora del Rosario' },
    // { name: 'San Miguel Arcángel y Todos los Ángeles' },
    // { name: 'Sagrado Corazón de Jesús' },
    // { name: 'Nuestra Señora del Carmen' },
    // { name: 'Nuestra Señora de la Piedad' },
    // { name: 'Nuestra Señora de Fátima' },
    // { name: 'Santa Teresita del Niño Jesús' },
    // { name: 'Santa Rafaela María del Sagrado Corazón de Jesús' },
    // { name: 'San Juan Bosco y Santo Domingo Savio' },
    // { name: 'Virgen María de la Medalla Milagrosa' },
    // { name: 'San Cayetano' },
    // { name: 'San Roque' },
    // { name: 'Cuasiparroquia Santísimo Sacramento y Santa Teresa de los Andes' },
    // { name: 'Nuestra Señora de Lujan' },
    // { name: 'San Ana' },
    // { name: 'San José Obrero' },
    // { name: 'San Francisco de Borja' },
    // { name: 'San Benito Abad' },
    // { name: 'Santa Lucía' },
    // { name: 'Jesucristo Maestro y Señor de la Humanidad y Nuestra Señora del Rosario de Pompeya' },
    { name: 'Santo Domingo Savio' },
    // { name: 'Nuestra Señora del Rosario de Pompeya' },
    // { name: 'San Agustín' },
    // { name: 'San Juan Bautista' },
    // { name: 'Inmaculado Corazón de María' },
    // { name: 'Cristo Peregrino y Santo Domingo de Guzmán' },
    // { name: 'Nuestra Señora de Guadalupe' },
    // { name: 'San Cipriano y San Francisco Javier' },
    // { name: 'San José' },
    // { name: 'Nuestra Señora del Rosario' },
    // { name: 'Inmaculada Concepción' },
    // { name: 'Nuestra Señora de la Esperanza' },
    // { name: 'Cuasiparroquia Santa Ana' },
    // { name: 'Basílica Nuestra Señora del Carmen de Nogoyá' },
    // { name: 'San Ramón' },
    // { name: 'San Lucas Evangelista' },
    // { name: 'Sagrado Corazón de Jesús' },
    // { name: 'Nuestra Señora de la Merced' },
    // { name: 'Nuestra Señora de la Paz' },
    // { name: 'San José' },
    // { name: 'Santa Elena' },
    // { name: 'San José' },
    // { name: 'María Auxiliadora' },
    // { name: 'Nuestra Señora de la Merced' },
    // { name: 'San Miguel' },
    // { name: 'Santa Ana' },
    // { name: 'Nuestra Señora de la Merced' },
    // { name: 'Cuasiparroquia Cristo Rey' },
    // { name: 'Nuestra Señora de la Merced' },
    // { name: 'Inmaculada Concepción' },
    // { name: 'Santa Rosa de Lima' },
    // { name: 'Inmaculada Concepción' },
    // { name: 'Cristo Rey' }
  ];

  var calendar = new Calendar("#calendar", data);

  const churchs = document.querySelector('#churchs');
  church.forEach((iglesia) => {
    churchs.innerHTML += '<option value="' + iglesia.name + '">' + iglesia.name + '</option>';
  });
  churchs.addEventListener("change", () => { calendar.draw(); });
})();
