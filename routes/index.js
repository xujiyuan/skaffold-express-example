var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log("express sssapp is called");
  res.render("index", { title: "Express" });
});

module.exports = router;
