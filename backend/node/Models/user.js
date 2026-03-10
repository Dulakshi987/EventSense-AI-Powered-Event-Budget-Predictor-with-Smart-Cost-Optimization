const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  reset_otp: { type: String },
  otp_expiry:{ type: Date },
  status:    { type: String, default: "active" },
  joinedAt:  { type: Date, default: Date.now },

  history: [
    {
      event: {
        event_type: String,
      },
      result: {
        // ── Core prediction ──────────────────────────
        predicted_total:     Number,
        budget_status:       String,   
        difference:          Number,

        // ── Breakdowns ───────────────────────────────
        breakdown:           Object,   
        optimized_breakdown: Object, 
        optimized_total:     Number,

        // ── User input fields ────────────────────────
        userInputBudget:     Number,   
        max_budget:          Number,
        num_guests:          Number,
        location:            String,
        event_type:          String,

        // ── Vendors ──────────────────────────────────
        vendors: [
          {
            service:    String,
            name:       String,
            contact:    String,
            location:   String,
            cost:       Number,
            rating:     Number,
            experience: Number,
            note:       String,
          }
        ],
      },
      createdAt: { type: Date, default: Date.now },
    }
  ]
});