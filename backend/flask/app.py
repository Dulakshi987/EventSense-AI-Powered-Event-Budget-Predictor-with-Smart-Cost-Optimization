from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import warnings
import traceback
import json
import os

warnings.filterwarnings("ignore", category=UserWarning)

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  

# =============================================
# GLOBAL VARIABLES
# =============================================

MODEL_DIR = '.'  

total_model = None
service_model = None  
scaler = None
encoders = {}
num_imputer = None
cat_imputer = None
processed_feature_cols = []
final_model_input_cols = []
raw_df = pd.DataFrame()

rec_models = {}
rec_scalers = {}
vendor_name_maps = {}

# =============================================
# LOAD MODELS & DATA
# =============================================

try:
    print("[STARTUP] Loading models and data...")

    total_model = joblib.load(os.path.join(MODEL_DIR, 'total_cost_model.pkl'))
    service_model = joblib.load(os.path.join(MODEL_DIR, 'service_cost_model.pkl'))  
    artifacts = joblib.load(os.path.join(MODEL_DIR, 'preprocessing_artifacts.pkl'))
    recommendation_artifacts = joblib.load(os.path.join(MODEL_DIR, 'recommendation_artifacts.pkl'))
    raw_df = pd.read_csv(os.path.join(MODEL_DIR, 'dataset.csv'))

    # unpack preprocessing artifacts
    scaler = artifacts.get("scaler")
    encoders = artifacts.get("encoders", {})
    num_imputer = artifacts.get("num_imputer")
    cat_imputer = artifacts.get("cat_imputer")
    processed_feature_cols = artifacts.get("features", [])
    final_model_input_cols = artifacts.get("final_model_input_cols", processed_feature_cols)

    # recommendation artifacts
    rec_models = recommendation_artifacts.get('models', {})
    rec_scalers = recommendation_artifacts.get('scalers', {})
    vendor_name_maps = recommendation_artifacts.get('vendor_name_maps', {})

    print("[STARTUP] Successfully loaded all models, artifacts and dataset")
    print(f"         Recommendation services: {list(rec_models.keys())}")
    print(f"         Vendor maps keys: {list(vendor_name_maps.keys())}")

except Exception as e:
    print(f"[STARTUP] Failed to load models / data: {e}")
    traceback.print_exc()

# =============================================
# HELPER: Prepare input features for total model
# =============================================

def prepare_model_input(user_dict):
    if scaler is None or not processed_feature_cols:
        raise ValueError("Preprocessing artifacts not loaded")

    try:
        df = pd.DataFrame([user_dict])

        # Fill missing columns
        for col in processed_feature_cols:
            if col not in df.columns:
                if col in artifacts.get("numerical_features_fitted_on", []):
                    df[col] = np.nan
                elif col in artifacts.get("categorical_features_fitted_on", []):
                    df[col] = "missing_category"
                else:
                    df[col] = 0

        df = df[processed_feature_cols].copy()

        # Imputation
        num_features = artifacts.get("numerical_features_fitted_on", [])
        if num_imputer and num_features:
            if hasattr(num_imputer, '_fill_dtype') and num_imputer._fill_dtype is not None:
                pass
            elif hasattr(num_imputer, '_fit_dtype') and num_imputer._fit_dtype is not None:
                num_imputer._fill_dtype = num_imputer._fit_dtype
            df[num_features] = num_imputer.transform(df[num_features])

        cat_features = artifacts.get("categorical_features_fitted_on", [])
        if cat_imputer and cat_features:
            if hasattr(cat_imputer, '_fill_dtype') and cat_imputer._fill_dtype is not None:
                pass
            elif hasattr(cat_imputer, '_fit_dtype') and cat_imputer._fit_dtype is not None:
                cat_imputer._fill_dtype = cat_imputer._fit_dtype
            df[cat_features] = cat_imputer.transform(df[cat_features])

        # Encoding
        for col, le in encoders.items():
            if col in df.columns:
                common = le.classes_[0]
                df[col] = df[col].apply(lambda x: x if x in le.classes_ else common)
                df[col] = le.transform(df[col].astype(str))

        # Scaling
        X_scaled = scaler.transform(df[processed_feature_cols])
        df_scaled = pd.DataFrame(X_scaled, columns=processed_feature_cols)

        return df_scaled[final_model_input_cols]

    except Exception as e:
        print("[prepare_model_input] Error:", str(e))
        raise

# =============================================
# Service cost breakdown via service_cost_model.pkl
# =============================================

SERVICE_TARGETS = [
    'photography_cost',
    'videography_cost',
    'catering_cost',
    'decoration_cost',
    'venue_cost',
    'music_dj_cost'
]

# service key in service_config → cost column name
SVC_TO_COST_COL = {
    'photography': 'photography_cost',
    'videography': 'videography_cost',
    'catering':    'catering_cost',
    'decoration':  'decoration_cost',
    'venue':       'venue_cost',
    'dj':          'music_dj_cost',
}

# dataset cost column per service 
SVC_DATASET_COST_COL = {
    'photography': 'photography_cost',
    'videography': 'videography_cost',
    'catering':    'catering_cost',
    'decoration':  'decoration_cost',
    'venue':       'venue_cost',
    'dj':          'music_dj_cost',
}

def get_service_costs_from_model(input_scaled_df):
    """
    Predict per-service costs using service_cost_model.pkl.
    Returns dict: { 'photography_cost': 85000.0, ... }
    """
    raw_pred  = service_model.predict(input_scaled_df)[0]
    all_cols  = processed_feature_cols
    dummy_row = np.zeros((1, len(all_cols)))

    for i, col in enumerate(SERVICE_TARGETS):
        if col in all_cols:
            dummy_row[0, all_cols.index(col)] = raw_pred[i]

    inversed = scaler.inverse_transform(dummy_row)[0]

    result = {}
    for col in SERVICE_TARGETS:
        if col in all_cols:
            result[col] = max(float(inversed[all_cols.index(col)]), 0.0)
        else:
            result[col] = 0.0
    return result

# Get vendor cost from matched dataset rows
def get_vendor_cost_from_dataset(df_match, svc):
    col = SVC_DATASET_COST_COL.get(svc)
    if col and col in df_match.columns:
        vals = pd.to_numeric(df_match[col], errors='coerce').dropna()
        if not vals.empty:
            return float(vals.median())
    return None

# =============================================
# MAIN PREDICTION ENDPOINT
# =============================================

@app.route('/predict', methods=['POST'])
def predict():
    if total_model is None:
        return jsonify({"error": "Prediction model not loaded"}), 503

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        print("[PREDICT] Request:", json.dumps(data, indent=2))

        # Normalize incoming field names
        user = {
            'event_type': data.get('event_type', 'Wedding'),
            'guest_count': int(data.get('num_guests', data.get('guest_count', 0))),
            'location': data.get('location', 'Colombo'),
            'max_budget': float(data.get('max_budget', 0)),
            'handover_budget': float(data.get('handover_budget', data.get('max_budget', 0))),
        }

        for svc in ['photography', 'videography', 'decoration', 'catering', 'venue', 'dj']:
            flag = 'has_dj' if svc == 'dj' else f'has_{svc}'
            user[flag] = int(data.get(flag, 0))

        #Predict total cost
        X = prepare_model_input(user)
        predicted_total = float(total_model.predict(X)[0])

        budget   = user['max_budget']
        handover = user['handover_budget']
        status   = "within" if predicted_total <= handover else "over"
        diff     = abs(handover - predicted_total)

        # Budget breakdown via service_cost_model.pkl
        breakdown           = {}
        optimized_breakdown = {}

        if service_model is not None:
            service_costs_raw = get_service_costs_from_model(X)
            services = ['photography', 'videography', 'decoration', 'catering', 'venue', 'dj']
            for s in services:
                flag     = 'has_dj' if s == 'dj' else f'has_{s}'
                cost_col = SVC_TO_COST_COL.get(s)
                if user.get(flag, 0) == 1 and cost_col:
                    amount = round(service_costs_raw.get(cost_col, 0))
                    breakdown[s] = amount
                    optimized_breakdown[s] = amount if status == "within" else round(amount * (handover / predicted_total))
        else:
           
            service_costs_raw = {}
            services = ['photography', 'videography', 'decoration', 'lighting', 'catering', 'venue', 'dj']
            for s in services:
                flag = 'has_dj' if s == 'dj' else f'has_{s}'
                if user.get(flag, 0) == 1:
                    amount = round(predicted_total * 0.16)
                    breakdown[s] = amount
                    optimized_breakdown[s] = amount if status == "within" else round(amount * (handover / predicted_total))
                    service_costs_raw[SVC_TO_COST_COL.get(s, s)] = amount

        #Vendor recommendations
        recommendations = []

        service_config = {
            "photography": {
                "flag": "has_photography",
                "name_col": "photographer_name",
                "contact_col": "photographer_contact",
                "rating_col": "photographer_rating",
                "exp_col": "photographer_experience",
            },
            "videography": {
                "flag": "has_videography",
                "name_col": "videographer_name",
                "contact_col": "videographer_contact",
                "rating_col": "videographer_rating",
                "exp_col": "videographer_experience",
            },
            "decoration": {
                "flag": "has_decoration",
                "name_col": "decorator_name",
                "contact_col": "decorator_contact",
                "rating_col": "decorator_rating",
                "exp_col": "decorator_experience",
            },
            "lighting": {
                "flag": "has_lighting",
                "name_col": "lighting_name",
                "contact_col": "lighting_contact",
                "rating_col": "lighting_rating",
                "exp_col": "lighting_experience",
            },
            "catering": {
                "flag": "has_catering",
                "name_col": "caterer_name",
                "contact_col": "caterer_contact",
                "rating_col": "caterer_rating",
                "exp_col": "caterer_experience",
            },
            "venue": {
                "flag": "has_venue",
                "name_col": "venue_name",
                "contact_col": "venue_contact",
                "rating_col": None,
                "exp_col": None,
            },
            "dj": {
                "flag": "has_dj",
                "name_col": "music_dj_name",
                "contact_col": "music_dj_contact",
                "rating_col": "music_dj_rating",
                "exp_col": "music_dj_experience",
            }
        }

        print("[DEBUG] Processing recommendations for services:")
        for svc, cfg in service_config.items():
            print(f"  - {svc}: flag={user.get(cfg['flag'], 0)}")

            if user.get(cfg["flag"], 0) != 1:
                continue

            # Use real cost from service_cost_model for allocated budget
            cost_col  = SVC_TO_COST_COL.get(svc)
            allocated = service_costs_raw.get(cost_col, breakdown.get(svc, 0)) if cost_col else breakdown.get(svc, 0)

            print(f"  - {svc}: allocated={allocated}")
            if allocated <= 0:
                continue

            
            rec_key  = 'music_dj' if svc == 'dj' else svc
            model    = rec_models.get(rec_key)
            sc       = rec_scalers.get(rec_key)
            name_map = vendor_name_maps.get(rec_key, {})

            print(f"  - {svc}: model={model is not None}, scaler={sc is not None}, map_len={len(name_map)}")

            if not (model and sc and name_map):
                recommendations.append({
                    "service": svc.title(),
                    "name": "No recommendation model",
                    "contact": "N/A",
                    "note": f"Missing {svc} artifacts in pkl"
                })
                continue

            event_type = user['event_type']
            loc        = user['location']
            guests     = user['guest_count']

            event_enc = 0
            if 'event_type' in encoders:
                le = encoders['event_type']
                v  = event_type if event_type in le.classes_ else le.classes_[0]
                event_enc = int(le.transform([v])[0])

            loc_enc = 0
            if 'location' in encoders:
                le = encoders['location']
                v  = loc if loc in le.classes_ else le.classes_[0]
                loc_enc = int(le.transform([v])[0])

            X_rec = np.array([[event_enc, loc_enc, guests, allocated]], dtype=float)
            try:
                X_rec_scaled = sc.transform(X_rec)
                pred_idx     = int(model.predict(X_rec_scaled)[0])
                best_vendor  = name_map.get(pred_idx, "Unknown Vendor")
                print(f"  - {svc}: predicted vendor index={pred_idx}, name={best_vendor}")
            except Exception as rec_e:
                print(f"[REC ERROR {svc}] {rec_e}")
                recommendations.append({
                    "service": svc.title(),
                    "name": "Prediction failed",
                    "contact": "N/A",
                    "note": str(rec_e)
                })
                continue

            col = cfg["name_col"]
            if col not in raw_df.columns:
                print(f"[WARN] {col} not in dataset!")
                recommendations.append({
                    "service": svc.title(),
                    "name": best_vendor,
                    "contact": "N/A",
                    "note": f"Column {col} missing in dataset"
                })
                continue

            # Match by name + location
            name_mask = raw_df[col].astype(str).str.strip() == str(best_vendor).strip()
            if user['location'].lower() != "all":
                loc_mask = raw_df['location'].astype(str).str.contains(user['location'], case=False, na=False)
                df_match = raw_df[name_mask & loc_mask].drop_duplicates(subset=[col])
            else:
                df_match = raw_df[name_mask].drop_duplicates(subset=[col])

            # Fallback: same vendor any location
            if df_match.empty:
                df_match = raw_df[name_mask].drop_duplicates(subset=[col])
                print(f"  - {svc}: No location match, using fallback")

            if not df_match.empty:
                row  = df_match.iloc[0]

                # vendor location from dataset
                vendor_location = str(row.get('location', user['location'])).strip() \
                                  if 'location' in raw_df.columns else user['location']

                # vendor cost from dataset 
                vendor_cost = get_vendor_cost_from_dataset(df_match, svc)
                if vendor_cost is None:
                    vendor_cost = allocated

                item = {
                    "service":  svc.title(),
                    "name":     str(row[col]).strip(),
                    "contact":  str(row.get(cfg["contact_col"], "N/A")).strip(),
                    "location": vendor_location,        
                    "cost":     round(vendor_cost),     
                }
                if cfg["rating_col"] and pd.notna(row.get(cfg["rating_col"])):
                    item["rating"] = float(row[cfg["rating_col"]])
                if cfg["exp_col"] and pd.notna(row.get(cfg["exp_col"])):
                    item["experience"] = int(row[cfg["exp_col"]])
                recommendations.append(item)
                print(f"  - {svc}: Added {item['name']} | {item['location']} | Rs.{item['cost']:,}")
            else:
                recommendations.append({
                    "service":  svc.title(),
                    "name":     best_vendor,
                    "contact":  "N/A",
                    "location": user['location'],   
                    "cost":     round(allocated),   
                    "note":     "Vendor details not found in dataset"
                })
                print(f"  - {svc}: No dataset match for {best_vendor}")

        print(f"[DEBUG] Final recommendations count: {len(recommendations)}")

        # Final response
        result = {
            "predicted_total":     round(predicted_total),
            "budget_status":       status,
            "difference":          round(diff),
            "breakdown":           breakdown,
            "optimized_total":     round(handover if status == "over" else predicted_total),
            "optimized_breakdown": optimized_breakdown,
            "vendors":             recommendations,
            "status":              "success"
        }

        return jsonify(result)

    except Exception as e:
        error_details = traceback.format_exc()
        print(f"[PREDICT ERROR] {error_details}")
        return jsonify({
            "error": str(e),
            "details": error_details[:500],
            "status": "error"
        }), 500


# =============================================
# RUN SERVER
# =============================================

if __name__ == '__main__':
    print("[SERVER] Starting EventSense Flask API on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)