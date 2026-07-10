from gradio_client import Client

client = Client("chris765/ihealthconnect")
result = client.predict(
    age=28,
    gravida=2,
    parity=1,
    gestational_age=24,
    systolic_bp=120,
    diastolic_bp=80,
    fundal_height=22,
    glucose=95,
    hemoglobin=12.5,
    weight=64,
    family_history="0",
    prior_loss="0",
    infection="0",
    folic_acid="ongoing",
    api_name="/predict"
)
print("Result:", result)