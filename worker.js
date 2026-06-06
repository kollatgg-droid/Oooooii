export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Bot is running")
    }

    const update = await request.json()
    const msg = update.message
    if (!msg) return new Response("ok")

    const chatId = msg.chat.id
    const userId = msg.from.id
    const text = msg.text || ""

    let user = await getUser(env, userId)

    // INIT USER
    if (!user) {
      user = {
        xp: 0,
        admin: false,
        game: null,
        name: msg.from.first_name
      }
    }

    // ---------------- START ----------------
    if (text === "/start") {
      await saveUser(env, userId, user)

      return send(env, chatId,
        "👋 Добро пожаловать!\n\n" +
        "Команды:\n" +
        "/profile - профиль\n" +
        "/game - игра\n" +
        "/ai текст - AI"
      )
    }

    // ---------------- PROFILE ----------------
    if (text === "/profile") {
      return send(env, chatId,
        `👤 PROFILE\n` +
        `Name: ${user.name}\n` +
        `XP: ${user.xp}\n` +
        `ADMIN: ${user.admin ? "YES 👑" : "NO"}`
      )
    }

    // ---------------- GAME ----------------
    if (text === "/game") {
      const num = Math.floor(Math.random() * 5) + 1
      user.game = num

      await saveUser(env, userId, user)

      return send(env, chatId, "🎮 Угадай число 1-5")
    }

    // ---------------- GUESS ----------------
    if (["1","2","3","4","5"].includes(text)) {
      if (user.game == text) {
        user.xp += 10
        await saveUser(env, userId, user)

        return send(env, chatId, "🎉 +10 XP")
      } else {
        return send(env, chatId, "❌ не угадал")
      }
    }

    // ---------------- AI (простая заглушка) ----------------
    if (text.startsWith("/ai")) {
      const prompt = text.replace("/ai", "").trim()
      return send(env, chatId, "🤖 AI: " + prompt)
    }

    // ---------------- AUTO ADMIN ----------------
    if (user.xp >= 1000 && !user.admin) {
      user.admin = true
      await saveUser(env, userId, user)

      return send(env, chatId, "👑 ТЫ ПОЛУЧИЛ АДМИНКУ!")
    }

    await saveUser(env, userId, user)

    return new Response("ok")
  }
}

// ================= FUNCTIONS =================

async function send(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  })
}

async function getUser(env, id) {
  const data = await env.DB.get(id.toString())
  return data ? JSON.parse(data) : null
}

async function saveUser(env, id, user) {
  await env.DB.put(id.toString(), JSON.stringify(user))
  }
