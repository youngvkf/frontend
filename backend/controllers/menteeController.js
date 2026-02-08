const User = require("../models/user");
const Todo = require("../models/todo");
const Reminder = require("../models/reminder");

exports.getDashboard = async (req, res) => {
  const userId = req.session.userId;

  try {
    const me = await User.findById(userId)
      .select("username role mentorId")
      .populate("mentorId", "username");

    if (!me) {
      return res.status(400).json({ ok: false, error: "유저 없음" });
    }

    return res.json({
      ok: true,
      data: {
        me: {
          username: me.username,
          role: me.role,
        },
        mentor: me.mentorId
          ? {
              id: me.mentorId._id,
              username: me.mentorId.username,
            }
          : null,
        todos: [],
        studyTime: {},
        weekSummary: [],
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "서버 오류" });
  }
};

exports.addTodo = async (req, res) => {
  const userId = req.session.userId;
  const { title, date, subject } = req.body;

  if (!title || !date) {
    return res.status(400).json({ ok: false, error: "title/date 필수" });
  }

  try {
    const todo = await Todo.create({
      userId,
      title,
      date,
      subject: subject || "기타", // ✅ 저장
    });

    return res.json({
      ok: true,
      data: {
        id: todo._id,
        title: todo.title,
        date: todo.date,
        subject: todo.subject, // ✅ 응답
        deletable: todo.deletable,
        isDone: todo.isDone,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "서버 오류" });
  }
};
