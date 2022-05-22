require("dotenv").config();

const generateServerString = () => {
    return (
        process.env.SERVER +
        (process.env.PORT == 80 ? "" : ":" + process.env.PORT) +
        process.env.BASE_URL
    );
};

module.exports = { generateServerString };
