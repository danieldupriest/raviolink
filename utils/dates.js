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

const shortMonths = {
    0: "Jan",
    1: "Feb",
    2: "Mar",
    3: "Apr",
    4: "May",
    5: "Jun",
    6: "Jul",
    7: "Aug",
    8: "Sep",
    9: "Oct",
    10: "Nov",
    11: "Dec",
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

function createDate(input = null) {
    let d;
    if (input) {
        d = new Date(input);
    } else {
        d = new Date();
    }

    d.toFullDate = () => {
        const day = days[d.getDay()];
        const date = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        let hours = d.getHours();
        let minutes = d.getMinutes();
        if (minutes.toString().length == 1) minutes = "0" + minutes;
        const amPm = hours >= 12 ? "pm" : "am";
        if (hours > 12) hours = hours % 12;

        return `${day}, ${month} ${date}, ${year} at ${hours}:${minutes} ${amPm}`;
    };

    d.toShortDate = () => {
        const date = d.getDate();
        const month = shortMonths[d.getMonth()];
        const year = d.getFullYear();

        return `${month}. ${date}, ${year}`;
    };

    d.toJSON = () => {
        return d.toFullDate();
    };

    d.toString = () => {
        return d.toFullDate();
    };

    return d;
}

module.exports = createDate;
