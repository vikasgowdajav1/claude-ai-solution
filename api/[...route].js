module.exports = async (req, res) => {
  try {
    const serverModule = await import('../server/api/index.js');
    return serverModule.default(req, res);
  } catch (error) {
    console.error('❌ Root Vercel API bootstrap failed:', error);
    return res.status(500).json({
      success: false,
      message: 'API bootstrap failed'
    });
  }
};