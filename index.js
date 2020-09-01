const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

const { hash, compare } = require("./bc");

app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));

const cookieSession = require("cookie-session");

app.use(
    cookieSession({
        secret: "Do you wanna know?",
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.get("/", (req, res) => {
    res.render("default", {
        layout: "main",
    });
});

app.post("/", (req, res) => {
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    db.getUserHash(req.body.email)
        .then((results) => {
            if (!results.rows[0]) {
                res.render("login", {
                    layout: "main",
                    //err: "error occured - email doesn't exisit ",
                });
            } else {
                compare(req.body.user_password, results.rows[0].user_password)
                    .then((matchingValue) => {
                        // sprawdzamy zgodnosc hasla
                        if (matchingValue) {
                            // zalogowany
                            req.session.userId = results.rows[0].id;
                            console.log(req.session.userId);
                            db.getSignature(req.session.userId)
                                .then((result) => {
                                    console.log(result);
                                    // if already signed
                                    if (
                                        result.rows[0] &&
                                        result.rows[0].user_signature
                                    ) {
                                        console.log("if");
                                        res.redirect("/petition/signed");
                                    }
                                    // if not signed
                                    else {
                                        console.log("else");
                                        res.redirect("/petition");
                                    }
                                })
                                .catch((err) => {
                                    console.log(
                                        "error in check if signed after logging ",
                                        err
                                    );
                                });
                        } else {
                            // haslo jest zle
                            res.render("login", {
                                layout: "main",
                                err: "error occured - wrong password",
                            });
                        }
                    })
                    .catch((err) =>
                        console.log(
                            "error in compare passwords - wrong password ",
                            err
                        )
                    );
            }
        })
        .catch((err) => console.log("error in getPw:", err));
});

app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
    });
});

app.post("/register", (req, res) => {
    console.log(req.body.user_password);
    hash(req.body.user_password)
        .then((hashedPw) => {
            db.addUser(
                req.body.first_name,
                req.body.last_name,
                req.body.email,
                hashedPw
            ).then((results) => {
                console.log("hashed user password:", hashedPw);
                req.session.userId = results.rows[0].id;
                res.redirect("/profile");
            });
        })
        .catch((err) => {
            console.log("error in hash in POST register", err);
            res.render("register", {
                layout: "main",
                err: "there was an error in register",
            });
        });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    console.log(req.body.homePage);
    db.addProfile(
        req.session.userId,
        req.body.age,
        req.body.city,
        req.body.homePage
    )
        .then((result) => {
            console.log("profile added");
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in POST /profile", err);
        });
});

app.get("/profile/edit", (req, res) => {
    res.render("edit", {
        layout: "main",
    });
});

app.post("/profile/edit", (req, res) => {
    let userId = req.session.userId;
    let first = req.body.first_name;
    let last = req.body.last_name;
    let email = req.body.email;
    let password = req.body.user_password;
    let age = req.body.age;
    let city = req.body.city;
    let homePage = req.body.homePage;
    console.log([userId, first, last, email, password, age, city, homePage]);

    db.getAllData(userId)
        .then((result) => {
            console.log(result.rows[0]);
            // editUser
            first = first !== "" ? first : result.rows[0].first_name;
            last = last !== "" ? first : result.rows[0].last_name;
            email = email !== "" ? email : result.rows[0].email;
            db.editUser(first, last, email, userId)
                .then(() => {
                    console.log("updated user");
                })
                .catch((err) => {
                    console.log("error in editUser", err);
                });
            // editPassword
            if (password !== "") {
                hash(password)
                    .then((hashedPw) => {
                        db.editPassword(hashedPw, userId)
                            .then(() => {
                                console.log("updated Password ");
                            })
                            .catch((err) => {
                                console.log("err in editPassword :", err);
                            });
                    })
                    .catch((err) => {
                        console.log("error in hash:", err);
                    });
            }
            // editProfile
            age = age !== "" ? age : result.rows[0].age;
            city = city !== "" ? city : result.rows[0].city;
            homePage = homePage !== "" ? homePage : result.rows[0].homePage;
            db.editProfile(age, city, homePage, userId)
                .then(() => {
                    console.log("updated profile");
                })
                .catch((err) => {
                    console.log("error in editProfile", err);
                });

            // if already signed
            if (result.rows[0].user_signature) {
                res.redirect("/petition/signed");
            }
            // if not signed
            else {
                res.redirect("/petition");
            }
        })
        .catch((err) => {
            console.log("error in POST /profile/edit", err);
        });

    console.log([userId, first, last, email, age, city, homePage]);
});

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
    });
});

app.post("/petition", (req, res) => {
    console.log("id post petition ", req.session.userId);
    db.addSignature(req.body.signature, req.session.userId)
        .then((result) => {
            console.log("signature added");
            req.session.signed = true;
            res.redirect("/petition/signed");
        })
        .catch((err) => {
            console.log("error in POST /petition", err);
        });
});

app.get("/petition/signed", (req, res) => {
    console.log(req.session.userId);
    db.getSignature(req.session.userId)
        .then((result) => {
            signature = result.rows[0].user_signature;
            res.render("signed", {
                layout: "main",
                signature,
            });
        })
        .catch((err) => {
            console.log("error in GET /petition/signed: ", err);
        });
});

app.post("/signed/delete", (req, res) => {
    console.log("signature deleted");
    db.deleteSignature(req.session.userId).then((result) => {
        req.session.signatureId = null;
        res.redirect("/petition");
    });
});

app.get("/petition/signers", (req, res) => {
    db.getSigners()
        .then((results) => {
            let allData = results.rows;
            console.log(allData);
            res.render("signers", {
                layout: "main",
                allData,
            });
        })
        .catch((err) => console.log("error in GET /petition/signers", err));
});

app.get("/petition/signers/:city", (req, res) => {
    let city = req.params.city;
    console.log(req.params.city);
    db.getCitySigners(city)
        .then((results) => {
            let allData = results.rows;
            console.log(allData);
            res.render("signers", {
                layout: "main",
                allData,
            });
        })
        .catch((err) =>
            console.log("error in GET /petition/signers/:city", err)
        );
});

app.post("/logout", (req, res) => {
    console.log("logout", req.session);
    req.session = null;
    res.redirect("/");
});

app.listen(process.env.PORT || 8080, () =>
    console.log("port 8080 is listening...")
);
