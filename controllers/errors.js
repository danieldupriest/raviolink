module.exports = (err, req, res, next) => {
    res.status(500);
    res.send("Server error: " + err);
};
