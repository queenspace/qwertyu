const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Подключение к базе данных MongoDB
mongoose
  .connect("mongodb+srv://admin:admin@cluster0.vurtyzd.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log(err);
  });

// Создание схемы пользователя
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Создание схемы новости
const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
  });
  
  const News = mongoose.model("News", newsSchema);

// Настройка сессий
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Роут для регистрации пользователя
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверка, существует ли пользователь с таким именем
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Такой пользователь уже есть" });
    }

    // Создание нового пользователя
    const newUser = new User({
      username,
      password, // Сохраняем пароль без шифрования
    });

    // Сохранение пользователя в базе данных
    await newUser.save();

    res.status(201).json({ message: "Регистрация успешна!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка регистрации!" });
  }
});

// Роут для авторизации пользователя
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверка, существует ли пользователь с таким именем
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "такого пользователя не существует" });
    }

    // Проверка совпадения пароля
    if (user.password !== password) {
      return res.status(401).json({ message: "не верный пароль" });
    }

    // Устанавливаем сессию пользователя
    req.session.user = user;

    res.status(200).json({ message: "Успешная авторизация" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка авторизации" });
  }
});

// Роут для выхода пользователя
app.post("/logout", (req, res) => {
  // Удаляем сессию пользователя
  req.session.destroy();
  res.status(200).json({ message: "Выход с сайта" });
});

// Роут для рендеринга главной страницы
app.get("/", (req, res) => {
  // Проверка статуса авторизации пользователя
  const authenticated = req.session.user ? true : false;

  res.render("index", { authenticated });
});

// Роут для рендеринга страницы регистрации
app.get("/register", (req, res) => {
  res.render("reg");
});

// Роут для рендеринга страницы авторизации
app.get("/login", (req, res) => {
  res.render("login");
});

// Роут для рендеринга страницы добавления новости
app.get("/add-news", (req, res) => {
    // Проверка статуса авторизации пользователя
    const authenticated = req.session.user ? true : false;
  
    if (!authenticated) {
      // Если пользователь не авторизован, перенаправляем на страницу авторизации
      return res.redirect("/login");
    }
  
    res.render("add-news");
  });

// Роут для рендеринга страницы новостей
app.get("/news", async (req, res) => {
    try {
      // Получение списка новостей из базы данных
      const news = await News.find();
  
      res.render("news", { news });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка получения новостей" });
    }
  });
  
  
  // Роут для добавления новости
  app.post("/add-news", async (req, res) => {
    try {
      const { title, description, imageUrl } = req.body;
  
      // Создание новости
      const newNews = new News({
        title,
        description,
        imageUrl,
      });
  
      // Сохранение новости в базе данных
      await newNews.save();
  
      res.redirect("/");
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка добавления новости" });
    }
  });
// Роут для выхода пользователя
app.get("/logout", (req, res) => {
    // Удаляем сессию пользователя
    req.session.destroy();
    res.status(200).json({ message: "Выход с сайта" });
  });
// Запуск сервера
app.listen(3000, () => {
  console.log("серверазапущен на 3000 порту");
});
