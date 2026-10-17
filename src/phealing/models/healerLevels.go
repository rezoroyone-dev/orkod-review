package models

// configuring the healer levels, there is no enum in GoLang

// Level is the healer level
type Level int

// Below are the list of possible levels
const (
	First  Level = 1
	Second Level = 2
	Third  Level = 3
	Fourth Level = 4
	Fifth  Level = 5
)

func (level Level) String() string {
	// declare an array of strings
	// ... operator counts how many
	// items in the array (7)
	names := [...]string{
		"First",
		"Second",
		"Third",
		"Fourth",
		"Fifth"}
	// prevent panicking in case of
	// `level` is out of range
	if level < First || level > Fifth {
		return "Unknown Healer Level"
	}
	return names[level]
}

// IsValid checks if the healer level is i the accepted range
func (level Level) IsValid() bool {
	return level >= First && level <= Fifth
}
