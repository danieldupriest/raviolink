module.exports = function (req, res, next) {
    console.log("Handling request to: " + req.url);
    console.log("With Params: " + JSON.stringify(req.params));
    console.log("With Body: " + JSON.stringify(req.body));
    next();
}
