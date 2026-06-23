const Worker = require("../models/Worker");

const registerWorker = async (req, res) => {
  try {
    const worker = await Worker.create({
      ...req.body,
      status: "pending_production"
    });
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveWorker = async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );
  res.json(worker);
};

const rejectWorker = async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  res.json(worker);
};

module.exports = {
  registerWorker,
  getWorkers,
  approveWorker,
  rejectWorker
};