const errorResponder = (err, req, res, next) => {
    console.error("Server error occurred. Stack trace:");
    console.error(err.stack);
    res.status(500).render("error", { status: 500, error: err });
};

module.exports = { errorResponder };
