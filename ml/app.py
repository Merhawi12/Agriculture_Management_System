"""
CropMind ML Service — FastAPI
Models: scikit-learn (RandomForest, LogisticRegression, LinearRegression)
        TensorFlow/Keras (Neural Network for crop yield)
Port: 5001
"""

import os, json, logging, warnings
from typing import Optional, List
from datetime import datetime, date

import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("agri-ml")

# ── Model storage paths ────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

YIELD_RF_PATH    = os.path.join(MODEL_DIR, "yield_rf.pkl")
YIELD_NN_PATH    = os.path.join(MODEL_DIR, "yield_nn.keras")
HEALTH_LR_PATH   = os.path.join(MODEL_DIR, "health_lr.pkl")
SOIL_RF_PATH     = os.path.join(MODEL_DIR, "soil_rf.pkl")
FINANCE_LR_PATH  = os.path.join(MODEL_DIR, "finance_lr.pkl")
SCALER_YIELD_PATH = os.path.join(MODEL_DIR, "scaler_yield.pkl")
SCALER_FIN_PATH   = os.path.join(MODEL_DIR, "scaler_fin.pkl")

# ── Feature encodings ──────────────────────────────────────────────────────────
CROP_TYPES = ["wheat", "corn", "soybeans", "rice", "tomatoes", "sunflowers", "french beans", "capsicum"]
IRRIG_TYPES = ["drip", "center pivot", "furrow", "flood", "sprinkler", "none"]

def encode_crop(name: str) -> int:
    n = name.lower()
    for i, c in enumerate(CROP_TYPES):
        if c in n:
            return i
    return 0

def encode_irrigation(irr: str) -> int:
    n = irr.lower()
    for i, t in enumerate(IRRIG_TYPES):
        if t in n:
            return i
    return 5  # none

# ── Training data generation ───────────────────────────────────────────────────
def generate_yield_data(n=800):
    rng = np.random.RandomState(42)
    area       = rng.uniform(1, 50, n)
    soil_ph    = rng.uniform(5.0, 8.0, n)
    org_matter = rng.uniform(1.0, 6.0, n)
    rainfall   = rng.uniform(400, 1200, n)
    temp_avg   = rng.uniform(15, 35, n)
    crop_enc   = rng.randint(0, len(CROP_TYPES), n)
    irr_enc    = rng.randint(0, len(IRRIG_TYPES), n)
    fertilizer = rng.uniform(50, 300, n)  # kg/ha

    # Realistic yield formula per ha
    base_yield = 2000 + crop_enc * 300
    yield_kg_ha = (
        base_yield
        + rainfall * 0.8
        - np.abs(soil_ph - 6.5) * 400
        + org_matter * 200
        - np.abs(temp_avg - 24) * 50
        + fertilizer * 1.5
        + (irr_enc < 5) * 500  # irrigated bonus
        + rng.normal(0, 200, n)
    )
    yield_kg_ha = np.clip(yield_kg_ha, 500, 8000)

    X = np.column_stack([area, soil_ph, org_matter, rainfall, temp_avg, crop_enc, irr_enc, fertilizer])
    y_per_ha = yield_kg_ha
    y_total  = yield_kg_ha * area
    return X, y_per_ha, y_total

def generate_health_data(n=600):
    rng = np.random.RandomState(42)
    age_months      = rng.uniform(1, 120, n)
    weight_kg       = rng.uniform(2, 800, n)
    species_enc     = rng.randint(0, 5, n)  # cattle/sheep/pig/chicken/goat
    vax_days        = rng.uniform(0, 365, n)
    body_temp       = rng.normal(38.5, 1.0, n)
    # 0=low, 1=medium, 2=high
    risk = np.zeros(n, dtype=int)
    risk[(vax_days > 180) | (body_temp > 40)] = 1
    risk[(vax_days > 300) | (body_temp > 41) | (age_months > 96)] = 2
    X = np.column_stack([age_months, weight_kg, species_enc, vax_days, body_temp])
    return X, risk

def generate_soil_data(n=600):
    rng = np.random.RandomState(42)
    ph            = rng.uniform(4.5, 8.5, n)
    nitrogen      = rng.uniform(10, 80, n)
    phosphorus    = rng.uniform(5, 60, n)
    potassium     = rng.uniform(80, 250, n)
    org_matter    = rng.uniform(1.0, 7.0, n)
    health_score  = (
        60
        - np.abs(ph - 6.5) * 12
        + org_matter * 4
        + nitrogen * 0.3
        + phosphorus * 0.2
        + (potassium - 150) * 0.05
        + rng.normal(0, 3, n)
    )
    health_score = np.clip(health_score, 10, 100)
    X = np.column_stack([ph, nitrogen, phosphorus, potassium, org_matter])
    return X, health_score

def generate_finance_data(n=500):
    rng = np.random.RandomState(42)
    month         = rng.randint(1, 13, n).astype(float)
    prev_revenue  = rng.uniform(50000, 200000, n)
    area_ha       = rng.uniform(50, 200, n)
    num_crops     = rng.randint(1, 7, n).astype(float)
    season_factor = 1 + 0.3 * np.sin(month * np.pi / 6)  # seasonal pattern
    next_revenue  = prev_revenue * (0.9 + rng.uniform(0, 0.4, n)) * season_factor + area_ha * 500
    X = np.column_stack([month, prev_revenue, area_ha, num_crops])
    return X, next_revenue

# ── Model training ─────────────────────────────────────────────────────────────
def train_all():
    from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
    from sklearn.linear_model import LinearRegression, LogisticRegression
    from sklearn.preprocessing import StandardScaler

    log.info("Training scikit-learn models...")

    # 1. Crop Yield — Random Forest
    Xy, y_per_ha, y_total = generate_yield_data()
    scaler_yield = StandardScaler()
    Xy_s = scaler_yield.fit_transform(Xy)
    yield_rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    yield_rf.fit(Xy_s, y_per_ha)
    joblib.dump(yield_rf, YIELD_RF_PATH)
    joblib.dump(scaler_yield, SCALER_YIELD_PATH)
    log.info("  ✓ Yield RandomForest trained")

    # 2. Livestock Health — Logistic Regression
    Xh, yh = generate_health_data()
    health_lr = LogisticRegression(max_iter=500, random_state=42, C=1.0)
    health_lr.fit(Xh, yh)
    joblib.dump(health_lr, HEALTH_LR_PATH)
    log.info("  ✓ Health LogisticRegression trained")

    # 3. Soil Health Score — Random Forest Regressor
    Xs, ys = generate_soil_data()
    soil_rf = RandomForestRegressor(n_estimators=80, random_state=42)
    soil_rf.fit(Xs, ys)
    joblib.dump(soil_rf, SOIL_RF_PATH)
    log.info("  ✓ Soil RandomForest trained")

    # 4. Financial Forecast — Linear Regression
    Xf, yf = generate_finance_data()
    scaler_fin = StandardScaler()
    Xf_s = scaler_fin.fit_transform(Xf)
    finance_lr = LinearRegression()
    finance_lr.fit(Xf_s, yf)
    joblib.dump(finance_lr, FINANCE_LR_PATH)
    joblib.dump(scaler_fin, SCALER_FIN_PATH)
    log.info("  ✓ Finance LinearRegression trained")

    # 5. Crop Yield — TensorFlow Neural Network
    log.info("  Training TensorFlow neural network...")
    try:
        import tensorflow as tf
        from tensorflow import keras

        tf.random.set_seed(42)
        Xy_full, y_ph, y_tot = generate_yield_data(n=1200)
        scaler_nn = StandardScaler()
        Xy_nn = scaler_nn.fit_transform(Xy_full)

        model = keras.Sequential([
            keras.layers.Input(shape=(Xy_nn.shape[1],)),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dropout(0.1),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(1, activation='linear'),
        ])
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        model.fit(
            Xy_nn, y_ph,
            epochs=50, batch_size=32,
            validation_split=0.15,
            verbose=0,
            callbacks=[keras.callbacks.EarlyStopping(patience=8, restore_best_weights=True)],
        )
        model.save(YIELD_NN_PATH)
        joblib.dump(scaler_nn, os.path.join(MODEL_DIR, "scaler_nn.pkl"))
        log.info("  ✓ TensorFlow neural network trained & saved")
    except Exception as e:
        log.warning(f"  ⚠ TF training skipped: {e}")

    log.info("All models trained successfully.")

# ── Load models ────────────────────────────────────────────────────────────────
models = {}

def load_models():
    global models
    if not os.path.exists(YIELD_RF_PATH):
        log.info("Models not found — training now (first run)...")
        train_all()

    from sklearn.preprocessing import StandardScaler

    models["yield_rf"]     = joblib.load(YIELD_RF_PATH)
    models["health_lr"]    = joblib.load(HEALTH_LR_PATH)
    models["soil_rf"]      = joblib.load(SOIL_RF_PATH)
    models["finance_lr"]   = joblib.load(FINANCE_LR_PATH)
    models["scaler_yield"] = joblib.load(SCALER_YIELD_PATH)
    models["scaler_fin"]   = joblib.load(SCALER_FIN_PATH)

    nn_scaler_path = os.path.join(MODEL_DIR, "scaler_nn.pkl")
    if os.path.exists(YIELD_NN_PATH):
        try:
            import tensorflow as tf
            models["yield_nn"]     = tf.keras.models.load_model(YIELD_NN_PATH)
            models["scaler_nn"]    = joblib.load(nn_scaler_path)
            log.info("TensorFlow model loaded.")
        except Exception as e:
            log.warning(f"Could not load TF model: {e}")

    log.info("All models loaded and ready.")

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CropMind ML Service",
    description="Crop yield, livestock health, soil analysis, and financial forecasting",
    version="1.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Request/Response schemas ───────────────────────────────────────────────────
class CropYieldRequest(BaseModel):
    area_ha: float = 10.0
    soil_ph: float = 6.5
    organic_matter: float = 3.5
    avg_rainfall_mm: float = 700.0
    avg_temp_c: float = 24.0
    crop_type: str = "wheat"
    irrigation: str = "drip"
    fertilizer_kg_ha: float = 150.0

class LivestockHealthRequest(BaseModel):
    age_months: float
    weight_kg: float
    species: str = "cattle"
    days_since_vaccination: float = 90.0
    body_temp_c: float = 38.5

class SoilHealthRequest(BaseModel):
    ph: float
    nitrogen_ppm: float
    phosphorus_ppm: float
    potassium_ppm: float
    organic_matter_pct: float

class FinancialForecastRequest(BaseModel):
    month: int
    prev_revenue: float
    farm_area_ha: float
    num_crops: int = 3

class BulkPredictRequest(BaseModel):
    crops: Optional[List[dict]] = []
    livestock: Optional[List[dict]] = []
    fields: Optional[List[dict]] = []
    month: Optional[int] = None
    prev_revenue: Optional[float] = None
    farm_area_ha: Optional[float] = None

SPECIES_MAP = {"cattle": 0, "sheep": 1, "pig": 2, "chicken": 3, "goat": 4}

SOIL_RECOMMENDATIONS = {
    (True,  True,  True):  "Excellent soil health — maintain current management",
    (True,  True,  False): "Good soil — potassium low, apply muriate of potash",
    (True,  False, True):  "Good soil — phosphorus low, apply DAP fertilizer",
    (True,  False, False): "Balanced pH — apply NPK blend to boost nutrients",
    (False, True,  True):  "Nutrients good — adjust pH with lime (if acidic) or sulfur",
    (False, True,  False): "Low pH and K — apply lime + potash combination",
    (False, False, True):  "Low pH and P — apply lime + phosphate",
    (False, False, False): "Poor soil — comprehensive amendment program needed",
}

def soil_recommendation(ph, n, p, k):
    ph_ok = 5.8 <= ph <= 7.2
    p_ok  = p  >= 20
    k_ok  = k  >= 120
    return SOIL_RECOMMENDATIONS.get((ph_ok, p_ok, k_ok), "Conduct detailed soil analysis")

def confidence_from_proba(proba_array):
    return int(np.max(proba_array) * 100)

# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": list(models.keys()),
        "tensorflow": "yield_nn" in models,
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.post("/predict/yield")
def predict_yield(req: CropYieldRequest):
    crop_enc = encode_crop(req.crop_type)
    irr_enc  = encode_irrigation(req.irrigation)
    X = np.array([[req.area_ha, req.soil_ph, req.organic_matter, req.avg_rainfall_mm,
                   req.avg_temp_c, crop_enc, irr_enc, req.fertilizer_kg_ha]])
    X_s = models["scaler_yield"].transform(X)

    # Random Forest prediction
    rf_yield_per_ha = float(models["yield_rf"].predict(X_s)[0])
    rf_yield_total  = rf_yield_per_ha * req.area_ha

    # TensorFlow prediction (if available)
    nn_yield_per_ha = None
    ensemble_yield  = rf_yield_per_ha
    if "yield_nn" in models:
        try:
            X_nn = models["scaler_nn"].transform(X)
            nn_pred = float(models["yield_nn"].predict(X_nn, verbose=0)[0][0])
            nn_yield_per_ha = max(500, min(8000, nn_pred))
            ensemble_yield  = round((rf_yield_per_ha * 0.55 + nn_yield_per_ha * 0.45), 1)
        except Exception:
            pass

    yield_per_ha = round(max(500, min(8000, ensemble_yield)), 1)
    yield_total  = round(yield_per_ha * req.area_ha, 1)

    # Confidence from feature importance heuristic
    ph_ok  = 5.8 <= req.soil_ph <= 7.2
    irr_ok = irr_enc < 5
    confidence = min(95, 65 + (10 if ph_ok else 0) + (10 if irr_ok else 0) + (5 if req.organic_matter > 3 else 0) + (5 if req.avg_rainfall_mm > 600 else 0))

    # Market price estimates (KES/kg)
    prices = {"wheat": 22, "corn": 20, "soybeans": 45, "rice": 60, "tomatoes": 80, "sunflowers": 35, "french beans": 120, "capsicum": 90}
    price = prices.get(req.crop_type.lower(), 25)

    risk_level = "Low"
    if not ph_ok or req.avg_rainfall_mm < 500: risk_level = "Medium"
    if req.soil_ph < 5.5 or req.avg_rainfall_mm < 400: risk_level = "High"

    recommendations = []
    if req.soil_ph < 5.8: recommendations.append("Apply agricultural lime to raise soil pH to 6.0–6.5")
    if req.soil_ph > 7.2: recommendations.append("Apply elemental sulfur to lower soil pH")
    if req.organic_matter < 2.5: recommendations.append("Incorporate compost or green manure to boost organic matter")
    if req.avg_rainfall_mm < 500 and irr_enc == 5: recommendations.append("Install irrigation system — low rainfall risk detected")
    if req.fertilizer_kg_ha < 100: recommendations.append("Increase fertilizer application for optimal yield")
    if not recommendations: recommendations.append("Maintain current agronomic practices — conditions are good")

    return {
        "algorithm": "RandomForest + TF Neural Network (ensemble)" if nn_yield_per_ha else "RandomForest Regressor",
        "yield_per_ha_kg": yield_per_ha,
        "yield_total_kg": yield_total,
        "rf_yield_per_ha": round(rf_yield_per_ha, 1),
        "nn_yield_per_ha": round(nn_yield_per_ha, 1) if nn_yield_per_ha else None,
        "predicted_revenue_kes": round(yield_total * price),
        "confidence_pct": confidence,
        "risk_level": risk_level,
        "market_price_kes_kg": price,
        "recommendations": recommendations,
        "features_used": ["area_ha", "soil_ph", "organic_matter", "rainfall", "temperature", "crop_type", "irrigation", "fertilizer"],
    }

@app.post("/predict/livestock-health")
def predict_livestock_health(req: LivestockHealthRequest):
    species_enc = SPECIES_MAP.get(req.species.lower(), 0)
    X = np.array([[req.age_months, req.weight_kg, species_enc, req.days_since_vaccination, req.body_temp_c]])
    proba = models["health_lr"].predict_proba(X)[0]
    risk_class = int(np.argmax(proba))
    risk_labels = ["Low", "Medium", "High"]

    recommendations = []
    if req.days_since_vaccination > 180: recommendations.append(f"Vaccination overdue — schedule immediately (last: {int(req.days_since_vaccination)} days ago)")
    if req.body_temp_c > 39.5: recommendations.append(f"Elevated body temperature {req.body_temp_c}°C — veterinary check recommended")
    if req.body_temp_c < 37.5: recommendations.append("Low body temperature — monitor for hypothermia or illness")
    if req.age_months > 84 and req.species.lower() == "cattle": recommendations.append("Senior animal — increase monitoring frequency")
    if not recommendations: recommendations.append("Animal health appears normal — maintain routine care")

    productivity = max(30, min(100, int(90 - risk_class * 15 - (req.days_since_vaccination / 365) * 10)))

    return {
        "algorithm": "Logistic Regression (multinomial)",
        "health_risk": risk_labels[risk_class],
        "risk_probabilities": {"Low": round(proba[0]*100,1), "Medium": round(proba[1]*100,1), "High": round(proba[2]*100,1)},
        "confidence_pct": round(float(np.max(proba)) * 100, 1),
        "productivity_score": productivity,
        "recommendations": recommendations,
        "vaccination_status": "Overdue" if req.days_since_vaccination > 180 else "Current",
        "features_used": ["age_months", "weight_kg", "species", "days_since_vaccination", "body_temperature"],
    }

@app.post("/predict/soil-health")
def predict_soil_health(req: SoilHealthRequest):
    X = np.array([[req.ph, req.nitrogen_ppm, req.phosphorus_ppm, req.potassium_ppm, req.organic_matter_pct]])
    health_score = float(models["soil_rf"].predict(X)[0])
    health_score = max(10, min(100, round(health_score, 1)))

    status = "Excellent" if health_score >= 80 else "Good" if health_score >= 60 else "Fair" if health_score >= 40 else "Poor"
    recommendation = soil_recommendation(req.ph, req.nitrogen_ppm, req.phosphorus_ppm, req.potassium_ppm)

    amendments = []
    if req.ph < 5.8: amendments.append({"input": "Agricultural Lime", "rate_kg_ha": round((6.5 - req.ph) * 1200), "reason": "Raise pH"})
    if req.ph > 7.5: amendments.append({"input": "Elemental Sulfur", "rate_kg_ha": round((req.ph - 6.5) * 150), "reason": "Lower pH"})
    if req.nitrogen_ppm < 30: amendments.append({"input": "Urea (46% N)", "rate_kg_ha": 150, "reason": "Nitrogen deficiency"})
    if req.phosphorus_ppm < 15: amendments.append({"input": "DAP (18-46-0)", "rate_kg_ha": 100, "reason": "Phosphorus deficiency"})
    if req.potassium_ppm < 100: amendments.append({"input": "Muriate of Potash", "rate_kg_ha": 80, "reason": "Potassium deficiency"})
    if req.organic_matter_pct < 2.5: amendments.append({"input": "Compost / FYM", "rate_kg_ha": 5000, "reason": "Build organic matter"})

    return {
        "algorithm": "RandomForest Regressor",
        "health_score": health_score,
        "status": status,
        "recommendation": recommendation,
        "amendments": amendments,
        "optimal_crops": _optimal_crops(req.ph, req.organic_matter_pct),
        "features_used": ["ph", "nitrogen", "phosphorus", "potassium", "organic_matter"],
    }

def _optimal_crops(ph, om):
    crops = []
    if 6.0 <= ph <= 7.0: crops += ["Wheat", "Corn", "Soybeans"]
    if 5.5 <= ph <= 6.5: crops += ["Rice", "Potatoes"]
    if ph >= 6.5: crops += ["Tomatoes", "Capsicum"]
    if om >= 3: crops.append("French Beans")
    return list(dict.fromkeys(crops))[:4] or ["Consult agronomist"]

@app.post("/predict/financial")
def predict_financial(req: FinancialForecastRequest):
    X = np.array([[req.month, req.prev_revenue, req.farm_area_ha, req.num_crops]])
    X_s = models["scaler_fin"].transform(X)
    next_revenue = float(models["finance_lr"].predict(X_s)[0])
    next_revenue = max(20000, next_revenue)

    # Seasonal adjustment
    seasonal_factor = 1 + 0.25 * np.sin(req.month * np.pi / 6)
    next_revenue = next_revenue * seasonal_factor

    expense_ratio = 0.38 + np.random.uniform(-0.03, 0.03)
    next_expenses = next_revenue * expense_ratio
    net_profit    = next_revenue - next_expenses

    return {
        "algorithm": "Linear Regression + Seasonal Adjustment",
        "next_month_revenue": round(next_revenue),
        "next_month_expenses": round(next_expenses),
        "net_profit": round(net_profit),
        "profit_margin_pct": round((net_profit / next_revenue) * 100, 1),
        "seasonal_factor": round(float(seasonal_factor), 3),
        "revenue_trend": "Increasing" if next_revenue > req.prev_revenue else "Decreasing",
        "confidence_pct": 78,
        "risk_factors": _finance_risks(req.month, req.num_crops),
        "features_used": ["month", "previous_revenue", "farm_area", "num_crops"],
    }

def _finance_risks(month, num_crops):
    risks = []
    if month in [1, 2, 7, 8]: risks.append("Off-season — lower expected revenues")
    if num_crops < 3: risks.append("Low crop diversity — higher revenue concentration risk")
    risks.append("Commodity price volatility")
    risks.append("Input cost fluctuations (fuel, fertilizer)")
    return risks[:3]

@app.post("/predict/bulk")
def bulk_predict(req: BulkPredictRequest):
    """Run all predictions for the farm dashboard in one call."""
    results = {}

    # Crop yield predictions
    crop_preds = []
    for crop in req.crops:
        try:
            cr = CropYieldRequest(**{
                "area_ha": crop.get("area_hectares", 10),
                "soil_ph": crop.get("soil_ph", 6.5),
                "organic_matter": crop.get("organic_matter", 3.5),
                "avg_rainfall_mm": crop.get("avg_rainfall_mm", 700),
                "avg_temp_c": crop.get("avg_temp_c", 24),
                "crop_type": crop.get("name", "wheat"),
                "irrigation": crop.get("irrigation", "drip"),
                "fertilizer_kg_ha": crop.get("fertilizer_kg_ha", 150),
            })
            pred = predict_yield(cr)
            crop_preds.append({
                "crop": crop.get("name"), "field": crop.get("field"),
                "harvest_date": crop.get("expected_harvest"),
                **pred,
            })
        except Exception as e:
            log.warning(f"Crop prediction failed: {e}")
    results["crop_predictions"] = crop_preds

    # Livestock health
    live_preds = []
    for animal in req.livestock:
        try:
            species = animal.get("type", "cattle").lower()
            birth = animal.get("birth_date", "2022-01-01")
            age_months = max(1, int((datetime.now() - datetime.strptime(birth, "%Y-%m-%d")).days / 30))
            lr = LivestockHealthRequest(
                age_months=age_months,
                weight_kg=animal.get("weight_kg", 200),
                species=species,
                days_since_vaccination=animal.get("days_since_vaccination", 90),
                body_temp_c=38.5,
            )
            pred = predict_livestock_health(lr)
            live_preds.append({"tag_id": animal.get("tag_id"), "type": animal.get("type"), "breed": animal.get("breed"), **pred})
        except Exception as e:
            log.warning(f"Livestock prediction failed: {e}")
    results["livestock_predictions"] = live_preds

    # Soil health per field
    soil_preds = []
    for field in req.fields:
        try:
            sr = SoilHealthRequest(
                ph=field.get("ph", 6.5),
                nitrogen_ppm=field.get("nitrogen", 40),
                phosphorus_ppm=field.get("phosphorus", 25),
                potassium_ppm=field.get("potassium", 150),
                organic_matter_pct=field.get("organic_matter", 3.5),
            )
            pred = predict_soil_health(sr)
            soil_preds.append({"field": field.get("name"), **pred})
        except Exception as e:
            log.warning(f"Soil prediction failed: {e}")
    results["soil_predictions"] = soil_preds

    # Financial forecast
    if req.prev_revenue and req.farm_area_ha:
        try:
            fr = FinancialForecastRequest(
                month=req.month or datetime.now().month,
                prev_revenue=req.prev_revenue,
                farm_area_ha=req.farm_area_ha,
                num_crops=len(req.crops) or 3,
            )
            results["financial_forecast"] = predict_financial(fr)
        except Exception as e:
            log.warning(f"Financial prediction failed: {e}")

    results["generated_at"] = datetime.utcnow().isoformat()
    results["models"] = {
        "yield": "RandomForest + TF Neural Net (ensemble)" if "yield_nn" in models else "RandomForest",
        "health": "Logistic Regression",
        "soil": "RandomForest Regressor",
        "finance": "Linear Regression + Seasonal",
    }
    return results

@app.get("/model-info")
def model_info():
    """Return metadata about trained models."""
    info = {
        "yield_rf": {"algorithm": "Random Forest Regressor", "n_estimators": 100, "features": 8, "target": "Yield kg/ha"},
        "health_lr": {"algorithm": "Logistic Regression", "classes": 3, "features": 5, "target": "Risk level (Low/Medium/High)"},
        "soil_rf": {"algorithm": "Random Forest Regressor", "n_estimators": 80, "features": 5, "target": "Soil health score 0-100"},
        "finance_lr": {"algorithm": "Linear Regression + Seasonal", "features": 4, "target": "Next month revenue (KES)"},
    }
    if "yield_nn" in models:
        info["yield_nn"] = {"algorithm": "TensorFlow Keras Neural Network", "layers": "128→64→32→1", "features": 8, "target": "Yield kg/ha"}
    return info

# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    load_models()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001, log_level="info")
