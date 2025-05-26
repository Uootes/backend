module.exports= function generateReferralCode() {
    return 'GSC' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

