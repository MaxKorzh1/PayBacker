const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const twilio = require("twilio");  // Подключаем Twilio

const app = express();
app.use(express.json());
app.use(cors());

// Twilio credentials (замени на свои реальные данные)
const accountSid = 'your_account_sid';
const authToken = 'your_auth_token';
const client = new twilio(accountSid, authToken);

// Подключение к MongoDB
mongoose.connect("mongodb://localhost:27017/referralApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Создание схемы и модели для рефералов
const ReferralSchema = new mongoose.Schema({
  referrer: String,  // Человек, который сделал рекомендацию
  client: String,    // Клиент
  business: String,  // Бизнес (например, название компании)
  status: { type: String, default: "pending" },  // Статус
  phoneNumbers: [String], // Массив номеров телефонов для отправки ссылок
  createdAt: { type: Date, default: Date.now },
});

const Referral = mongoose.model("Referral", ReferralSchema);

// Функция отправки SMS
const sendSMS = (phoneNumbers, referralLink) => {
  phoneNumbers.forEach((number) => {
    client.messages
      .create({
        body: `You have been referred! Click here: ${referralLink}`,
        from: '+1234567890',  // Твой Twilio номер
        to: number,
      })
      .then((message) => console.log(`SMS sent to ${number}`))
      .catch((error) => console.log(error));
  });
};

// Создание реферала и отправка SMS
app.post("/create", async (req, res) => {
  const { referrer, client: clientName, business, phoneNumbers } = req.body;
  
  // Создаем новый реферал
  const referral = new Referral({ referrer, client: clientName, business, phoneNumbers });
  await referral.save();

  // Генерируем реферальную ссылку
  const referralLink = `http://yourwebsite.com/referral/${referral._id}`;
  
  // Отправляем SMS всем номерам
  sendSMS(phoneNumbers, referralLink);
  
  res.json({ success: true, referral });
});

// Подтверждение реферала
app.post("/confirm/:id", async (req, res) => {
  const { id } = req.params;
  
  // Обновляем статус реферала на "confirmed"
  await Referral.findByIdAndUpdate(id, { status: "confirmed" });

  // Получаем информацию о реферале
  const referral = await Referral.findById(id);

  // Отправка уведомления
  const confirmationMessage = `Your referral for ${referral.business} is confirmed!`;
  sendSMS(referral.phoneNumbers, confirmationMessage);

  res.json({ success: true });
});

// Получение всех рефералов
app.get("/referrals", async (req, res) => {
  const referrals = await Referral.find();
  res.json(referrals);
});

app.listen(5000, () => console.log("Server running on port 5000"));
