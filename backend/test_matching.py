"""
Test matching logic locally
"""

# Simulate the scenario
my_gender = "male"
looking_for = "male"
candidate_gender = "male"
candidate_looking_for = "male"

target_gender = looking_for.lower() if looking_for.lower() != "any" else None
my_gender_lower = my_gender.lower()

print(f"I am: {my_gender}, looking for: {looking_for}")
print(f"Candidate is: {candidate_gender}, looking for: {candidate_looking_for}")
print(f"target_gender: {target_gender}")
print()

# Check mutual compatibility
i_want_them = (target_gender is None or candidate_gender == target_gender)
they_want_me = (candidate_looking_for == "any" or candidate_looking_for == my_gender_lower)

print(f"i_want_them = (target_gender is None or candidate_gender == target_gender)")
print(f"i_want_them = ({target_gender} is None or {candidate_gender} == {target_gender})")
print(f"i_want_them = {i_want_them}")
print()

print(f"they_want_me = (candidate_looking_for == 'any' or candidate_looking_for == my_gender_lower)")
print(f"they_want_me = ({candidate_looking_for} == 'any' or {candidate_looking_for} == {my_gender_lower})")
print(f"they_want_me = {they_want_me}")
print()

print(f"Match success: {i_want_them and they_want_me}")
