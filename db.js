const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/caper-petition"
);

module.exports.addSignature = (user_signature, user_id) => {
    let q =
        "INSERT INTO signatures (user_signature, user_id) VALUES ($1, $2) RETURNING id";
    let params = [user_signature, user_id];
    return db.query(q, params);
};

module.exports.getSignature = function (user_id) {
    let q = "SELECT user_signature FROM signatures WHERE user_id = $1";
    let params = [user_id];
    return db.query(q, params);
};

module.exports.addUser = function (firstName, lastName, email, userPassword) {
    let q =
        "INSERT INTO users (first_name, last_name, email, user_password) VALUES ($1, $2, $3, $4) RETURNING id";
    let params = [firstName, lastName, email, userPassword];
    return db.query(q, params);
};

module.exports.addProfile = function (userId, age, city, homePage) {
    let q =
        "INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4) RETURNING id";
    let params = [userId, +age || null, city, homePage];
    return db.query(q, params);
};

module.exports.getUserHash = function (email) {
    let q = "SELECT * FROM users where email = $1";
    let params = [email];
    return db.query(q, params);
};

module.exports.getSigners = function () {
    let q = `SELECT first_name, last_name, age, city, url FROM users 
        INNER JOIN signatures ON users.id = signatures.user_id 
        LEFT JOIN user_profiles ON users.id = user_profiles.user_id`;
    return db.query(q);
};

module.exports.getCitySigners = function (city) {
    let q = `SELECT first_name, last_name, age, url FROM users 
        INNER JOIN signatures ON users.id = signatures.user_id 
        INNER JOIN user_profiles ON users.id = user_profiles.user_id WHERE city = $1;`;
    let params = [city];
    return db.query(q, params);
};

module.exports.getAllData = function (user_id) {
    let q = `SELECT first_name, last_name, email, user_password, age, city, url, user_signature FROM users 
        LEFT JOIN signatures ON users.id = signatures.user_id 
        LEFT JOIN user_profiles ON users.id = user_profiles.user_id
        WHERE users.id = $1`;
    let params = [user_id];
    return db.query(q, params);
};

module.exports.editPassword = function (hashedPw, userId) {
    let q = `UPDATE users SET user_password = $1 WHERE id = $2`;
    let params = [hashedPw, userId];
    return db.query(q, params);
};

module.exports.editUser = function (firstName, lastName, email, userId) {
    let q = `UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4`;
    let params = [firstName, lastName, email, userId];
    return db.query(q, params);
};

module.exports.editProfile = function (age, city, homePage, userId) {
    let q = `INSERT INTO user_profiles (user_id, age, city, url)
             VALUES ($4, $1, $2, $3)
             ON CONFLICT (user_id)
             DO UPDATE SET age = $1, city = $2, url = $3`;
    let params = [age, city, homePage, userId];
    return db.query(q, params);
};
module.exports.deleteSignature = function (signId) {
    let q = `DELETE FROM signatures WHERE signatures.user_id = $1`;
    let params = [signId];
    return db.query(q, params);
};
