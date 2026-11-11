# Mobile Testing
- **Unit (jest-expo):** validators, error mapper, secureStorage wrapper (mock), message grouping, cache patch helpers.
- **Component:** OtpInput, MemberCard, composer behaviour, FilterChips.
- **Integration:** refresh single-flight, logout on refresh failure, optimistic send failure → retry.
- **Privacy:** rendered lists contain no email/fullName; screen-capture prevention active on chat; push content generic.
- **Device matrix (manual):** small Android (360dp), large Android, iPhone SE & Pro Max sizes; dark/light; offline→online; background→foreground reconnect; keyboard open/close in thread; rotation locked to portrait (decision logged).
- **Run it:** every phase must be run on a real emulator/device — a passing typecheck is not proof the screen works.
