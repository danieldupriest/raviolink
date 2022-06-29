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
}

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
}

const days = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
}

/**
 * Returns a date object with some customized methods
 * @param {Number} ms - ms since Unix epoch
 * @returns {Object} A custom date object
 */
export default function createDate(ms = null) {
    if (ms) {
        var d = new Date(ms)
    } else {
        var d = new Date()
    }

    /**
     * Generates a full-length date string
     * @returns {String} A date string in the format "Tuesday, January 1, 2020 at 12:30 pm"
     */
    d.toFullDate = () => {
        const day = days[d.getDay()]
        const date = d.getDate()
        const month = months[d.getMonth()]
        const year = d.getFullYear()
        let hours = d.getHours()
        let minutes = d.getMinutes()
        if (minutes.toString().length == 1) minutes = "0" + minutes
        const amPm = hours >= 12 ? "pm" : "am"
        if (hours > 12) hours = hours % 12

        return `${day}, ${month} ${date}, ${year} at ${hours}:${minutes} ${amPm}`
    }

    /**
     * Generates a shortened date string
     * @returns {String} A date string in the format "Jan. 1, 2020"
     */
    d.toShortDate = () => {
        const date = d.getDate()
        const month = shortMonths[d.getMonth()]
        const year = d.getFullYear()

        return `${month}. ${date}, ${year}`
    }

    /**
     * Generates an ISO date string
     * @returns {String} A date string in the foramt "2020-01-01 12:30:00"
     */
    d.toISODate = () => {
        const date = d.getDate().toString().padStart(2, 0)
        const month = (d.getMonth() + 1).toString().padStart(2, 0)
        const year = d.getFullYear()
        const hours = d.getHours().toString().padStart(2, 0)
        const minutes = d.getMinutes().toString().padStart(2, 0)
        const seconds = d.getSeconds().toString().padStart(2, 0)

        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`
    }

    /**
     * Generates a full length date string when converting to JSON
     * @returns
     */
    d.toJSON = () => {
        return d.toFullDate()
    }

    /**
     * Generates a full length date string when converting to string
     * @returns
     */
    d.toString = () => {
        return d.toFullDate()
    }

    return d
}
