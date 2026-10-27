module.exports = (req, res) => {
  res.json({ status: 'ok', service: 'TechXConf Career API', version: '1.0.0', timestamp: new Date().toISOString() });
};
