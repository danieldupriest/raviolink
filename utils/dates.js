const months = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
};

const days = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
};

module.exports = class RavioliDate extends Date {
    constructor(arg) {
        super(arg);
        console.log("This: " + this);
    }

    toJSON() {
        return this.toAmericanDate();
    }

    toString() {
        return this.toAmericanDate();
    }

    toAmericanDate() {
        const day = days[this.getDay()];
        const date = this.getDate();
        const month = months[this.getMonth()];
        const year = this.getFullYear();
        let hours = this.getHours();
        let minutes = this.getMinutes();
        if (minutes.toString().length == 1) minutes = "0" + minutes;
        const amPm = hours >= 12 ? "pm" : "am";
        if (hours > 12) hours = hours % 12;

        return `${day}, ${month} ${date}, ${year} at ${hours}:${minutes} ${amPm}`;
    }
};
