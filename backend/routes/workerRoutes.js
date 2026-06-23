const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');

// Get workers for CEO
router.get('/list/ceo', async (req, res) => {
  try {
    const workers = await Worker.find({ 
      status: { $in: ['pending_ceo', 'finalized'] } 
    });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CEO approves worker
router.put('/approve/ceo/:id', async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      {
        status: 'pending_hr',
        salary: req.body.salary,
        dailyRate: req.body.dailyRate,
        joiningDate: req.body.joiningDate,
        bondYears: req.body.bondYears,
        esiPfPercentage: req.body.esiPfPercentage,
        applyESI: req.body.applyESI,
        subDept: req.body.subDept,
        category: req.body.category
      },
      { new: true }
    );
    res.json(updatedWorker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CEO rejects worker
router.put('/reject/ceo/:id', async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected_by_ceo' },
      { new: true }
    );
    res.json(updatedWorker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;