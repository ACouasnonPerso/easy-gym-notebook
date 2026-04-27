import sys
path = "C:/Users/Anatole/Desktop/code/easy-gym-notebook/src/app/core_logic/exercise-chrono/exercise-chrono.service.spec.ts"

lines = [
    "",
    "describe(\"ExerciseChronoService custom settings and OVER state Story 2\", () => {",
]

with open(path, "a", encoding="utf-8") as f:
    f.write("
".join(lines))
print("ok")
