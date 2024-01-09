import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "jesus",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = await getUsers()
console.log(users, 'users')

async function checkVisisted() {
  console.log(currentUserId)
  const result = await db.query(`SELECT country_code FROM visited_countries where user_id = ${currentUserId}`);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getUsers() {
  try {
    const result = await db.query(`select * from users`)
    return result.rows
  } catch (error) {
    console.log(error)
  }
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: users.filter(user => user.id == currentUserId)[0].color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add) {
    res.render('new.ejs') 
  } else {
    currentUserId = Number(req.body.user)
    res.redirect('/')
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const name = req.body.name
  const color = req.body.color
  try {
    const resp = await db.query(`insert into users (name, color) values ($1, $2) returning id`, 
    [name, color]
    )
    console.log(resp, 'resp')
    users.push(
      {
        id: resp,
        name: name,
        color: color
      }
    )
  } catch (error) {
    console.log(error)
  }
  res.redirect('/')
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
