// English teaching texts: a one-line summary per part for the "Learn" sidebar and
// the complete guide on /en/learn.

import { PALETTE } from '../circuit.ts';
import BASICS from './basics/en.ts';
import type { Lesson, LearnContent } from './types.ts';

const t2 = (f: (a: number, b: number) => number) => ({
  head: ['A', 'B', 'out'],
  rows: [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => [a, b, f(a, b)].map(String)),
});

const GROUP_NAMES = { inputs: 'Inputs', gates: 'Logic gates', routing: 'Signal routing', arithmetic: 'Arithmetic', memory: 'Memory', outputs: 'Outputs' };

const LESSONS: Lesson[] = [
  {
    kind: "buffer", group: "gates",
    summary: "Copies the input without inversion: 0 stays 0, 1 stays 1.",
    expr: "Y = A",
    table: {
      head: ["A", "Y"],
      rows: [
        ["0", "0"],
        ["1", "1"],
      ],
    },
    guide: [
      {"title": "What it does", "body": ["A buffer has one input and one output. Unlike NOT, it preserves the logical value. In real hardware it can drive a load or isolate circuit stages; this ideal simulator models only its logic, without voltage, current or propagation delay."]},
      {"title": "Try it", "body": ["Connect a switch to A and an LED to Y. The LED follows the switch. A buffer is not a tri-state buffer: there is no enable pin or high-impedance state here."]},
    ],
  },
  {
    kind: "and3", group: "gates",
    summary: "Gives 1 only when all three inputs are 1.",
    expr: "Y = A · B · C",
    table: {
      head: ["A", "B", "C", "Y"],
      rows: [
        ["0", "0", "0", "0"],
        ["0", "0", "1", "0"],
        ["0", "1", "0", "0"],
        ["0", "1", "1", "0"],
        ["1", "0", "0", "0"],
        ["1", "0", "1", "0"],
        ["1", "1", "0", "0"],
        ["1", "1", "1", "1"],
      ],
    },
    guide: [
      {"title": "Three conditions at once", "body": ["A three-input AND extends the two-input AND: A, B and C must all be 1. Any 0 forces Y to 0. It is equivalent to two two-input AND gates in series."]},
      {"title": "Try it", "body": ["Wire three switches to A, B and C and an LED to the output. Try a safety interlock: power, door closed and permission must all be true."]},
    ],
  },
  {
    kind: "or3", group: "gates",
    summary: "Gives 1 when any of its three inputs is 1.",
    expr: "Y = A + B + C",
    table: {
      head: ["A", "B", "C", "Y"],
      rows: [
        ["0", "0", "0", "0"],
        ["0", "0", "1", "1"],
        ["0", "1", "0", "1"],
        ["0", "1", "1", "1"],
        ["1", "0", "0", "1"],
        ["1", "0", "1", "1"],
        ["1", "1", "0", "1"],
        ["1", "1", "1", "1"],
      ],
    },
    guide: [
      {"title": "Three possible triggers", "body": ["A three-input OR is 0 only for 000. One, two or three active inputs all produce 1. It is equivalent to two two-input OR gates in series."]},
      {"title": "Try it", "body": ["Connect three alarm sensors represented by switches. Any active sensor lights the LED. This is inclusive OR, not odd parity."]},
    ],
  },
  {
    kind: "mux", group: "routing",
    summary: "Selects which of two signals reaches the output.",
    expr: "Y = A·S̄ + B·S",
    table: {
      head: ["A", "B", "S", "Y"],
      rows: [
        ["0", "0", "0", "0"],
        ["0", "0", "1", "0"],
        ["0", "1", "0", "0"],
        ["0", "1", "1", "1"],
        ["1", "0", "0", "1"],
        ["1", "0", "1", "0"],
        ["1", "1", "0", "1"],
        ["1", "1", "1", "1"],
      ],
    },
    guide: [
      {"title": "Choose a path", "body": ["MUX means multiplexer. With selector S = 0, Y copies A; with S = 1, Y copies B. A and B carry data; S chooses the source. This is a one-bit 2-to-1 selector without an enable input."]},
      {"title": "Try it", "body": ["Connect three switches to A, B and S in that order. Give A and B different values, then toggle S. In the demo they appear as switches A, B and C: C controls pin S."]},
    ],
  },
  {
    kind: "demux", group: "routing",
    summary: "Sends one signal to one of two outputs; the other stays 0.",
    expr: "Y0 = D·S̄; Y1 = D·S",
    table: {
      head: ["D", "S", "Y0", "Y1"],
      rows: [
        ["0", "0", "0", "0"],
        ["0", "1", "0", "0"],
        ["1", "0", "1", "0"],
        ["1", "1", "0", "1"],
      ],
    },
    guide: [
      {"title": "Distribute a signal", "body": ["DEMUX means demultiplexer. With S = 0, D goes to Y0; with S = 1, D goes to Y1. The unselected output is always 0. This model has no enable input or high-impedance state."]},
      {"title": "Try it", "body": ["Wire one switch to D and another to S, with an LED on each output. Set D to 1 to see the selector move the signal between the LEDs. With D at 0, both LEDs stay off."]},
    ],
  },
  {
    kind: "halfadder", group: "arithmetic",
    summary: "Adds two bits and exposes both sum and carry.",
    expr: "S = A ⊕ B; C = A·B",
    table: {
      head: ["A", "B", "S", "C"],
      rows: [
        ["0", "0", "0", "0"],
        ["0", "1", "1", "0"],
        ["1", "0", "1", "0"],
        ["1", "1", "0", "1"],
      ],
    },
    guide: [
      {"title": "Two bits, two outputs", "body": ["The half adder computes A + B. S is the low bit and C is the carry. For 1 + 1, S = 0 and C = 1: the binary result is 10, read as C then S."]},
      {"title": "Try it", "body": ["Connect two switches to A and B and two LEDs to S and C. This block is equivalent to an XOR and an AND. It has no carry input, so use a full adder for later stages of a multi-bit addition."]},
    ],
  },
  {
    kind: "fulladder", group: "arithmetic",
    summary: "Adds A, B and an incoming carry, producing sum and carry out.",
    expr: "S = A ⊕ B ⊕ Cin; Cout = A·B + Cin·(A ⊕ B)",
    table: {
      head: ["A", "B", "Cin", "S", "Cout"],
      rows: [
        ["0", "0", "0", "0", "0"],
        ["0", "0", "1", "1", "0"],
        ["0", "1", "0", "1", "0"],
        ["0", "1", "1", "0", "1"],
        ["1", "0", "0", "1", "0"],
        ["1", "0", "1", "0", "1"],
        ["1", "1", "0", "0", "1"],
        ["1", "1", "1", "1", "1"],
      ],
    },
    guide: [
      {"title": "Add with a carry", "body": ["The full adder computes A + B + Cin. S is the low bit and Cout is the carry to the next column. For 1 + 1 + 1, both outputs are 1: binary 11. The input Cin is a value, not a clock."]},
      {"title": "Try it", "body": ["Connect three switches to A, B and Cin and two LEDs to S and Cout. Chain Cout into Cin of the next full adder to add multi-bit numbers. The first stage starts with Cin at 0."]},
    ],
  },
  {
    kind: 'switch', group: 'inputs',
    summary: 'On and off: in position 1 it sends a signal, in 0 it does not.',
    guide: [
      { title: 'What it is', body: [
        'The switch (or slide switch) is the simplest input of a digital circuit. It has two fixed positions: 0, off, and 1, on. It stays where you left it until someone moves it again.',
        'In a real circuit, the switch connects its output to the positive supply (1, high level) or to ground (0, low level). In 5 V digital electronics, "1" is usually something close to 5 V and "0" something close to 0 V.',
      ] },
      { title: 'Using it on the board', body: [
        'Click the switch to change its position. Each switch gets a letter (A, B, C...) printed next to it, and you can also press that letter on the keyboard.',
        'The output is on the right of the part. Pull a wire from it to the input of a gate to use the switch value in the circuit.',
      ] },
      { title: 'What it is for', body: [
        'Use switches to feed the inputs of a truth table: with two switches you can test all four combinations (00, 01, 10, 11) of any two-input gate.',
      ] },
    ],
  },
  {
    kind: 'button', group: 'inputs',
    summary: 'Sends 1 only while it is held down.',
    guide: [
      { title: 'What it is', body: [
        'The push button is a momentary input. It is 1 only while pressed and goes back to 0 by itself when you let go.',
        'The difference from the switch is mechanical memory: the switch stays where you left it, the button always springs back.',
      ] },
      { title: 'Using it on the board', body: [
        'Hold the button with the mouse or your finger. While it is down, the output stays lit.',
      ] },
      { title: 'What it is for', body: [
        'Buttons are good for making pulses: stepping a counter one step at a time, resetting a latch or simulating a doorbell.',
        'Real buttons "bounce": the contact opens and closes several times within a few milliseconds. In the simulator the signal is clean, but on a real bench this has to be handled.',
      ] },
    ],
  },
  {
    kind: 'clock', group: 'inputs',
    summary: 'Toggles between 0 and 1 by itself at a steady pace.',
    guide: [
      { title: 'What it is', body: [
        'The clock is an oscillator: it switches between 0 and 1 by itself, nonstop, always at the same pace. That pace is the frequency, measured in hertz (Hz). 1 Hz means one full cycle (0 then 1) per second.',
        'The moment the signal goes from 0 to 1 is called the rising edge. That is when sequential circuits, such as the D flip-flop, do something.',
      ] },
      { title: 'Using it on the board', body: [
        'Click the clock to cycle the frequency through 0.5, 1, 2, 4 and 8 Hz. The small LED on top shows the current level.',
        'The pause button on the top bar freezes every clock, so you can look at the circuit calmly.',
      ] },
      { title: 'What it is for', body: [
        'It is the "heartbeat" of every sequential circuit: counters, registers, processors. A modern computer runs on a clock of billions of hertz (GHz).',
      ] },
    ],
  },
  {
    kind: 'const', group: 'inputs',
    summary: 'Always 1, like a wire tied to the positive supply.',
    guide: [
      { title: 'What it is', body: [
        'Source 1 is a constant: its output is always 1. It is the same as tying a wire straight to the positive supply (VCC).',
      ] },
      { title: 'What it is for', body: [
        'Use it when an input has to stay at 1, for example to enable a gate permanently, or tie one input of an XOR to 1 to turn it into an inverter.',
      ] },
    ],
  },
  {
    kind: 'not', group: 'gates',
    summary: 'Inverts the signal: 1 in, 0 out; 0 in, 1 out.',
    expr: 'S = Ā  (read "not A")',
    table: { head: ['A', 'out'], rows: [['0', '1'], ['1', '0']] },
    guide: [
      { title: 'What it is', body: [
        'The NOT gate, also called an inverter, has one input and one output. The output is always the opposite of the input.',
        'Its traditional symbol is a triangle with a small circle at the tip. The circle means inversion and also shows up on the NAND, NOR and XNOR gates.',
      ] },
      { title: 'In the real world', body: [
        'The 74·04 chip has six independent inverters in a single 14-pin package.',
      ] },
      { title: 'What it is for', body: [
        'Negating a condition: "light the LED when the switch is off". It is also the basic piece of oscillators: an odd number of inverters wired in a ring never settles. If you wire the output of a NOT back into its own input, the simulator tells you the circuit is oscillating.',
      ] },
    ],
  },
  {
    kind: 'and', group: 'gates',
    summary: 'Gives 1 only when both inputs are 1.',
    expr: 'S = A · B  (read "A and B")',
    table: t2((a, b) => a & b),
    guide: [
      { title: 'What it is', body: [
        'The AND gate gives 1 only when every input is 1. A single input at 0 is enough to make the output 0.',
        'Think of two switches in series on a wire: the light only turns on if both are closed.',
      ] },
      { title: 'Boolean algebra', body: [
        'AND is written like a multiplication: A · B. And it really behaves like one: 1·1 = 1 and anything times 0 is 0.',
      ] },
      { title: 'In the real world', body: [
        'The 74·08 chip has four two-input AND gates.',
      ] },
      { title: 'What it is for', body: [
        'Requiring several conditions to be true at the same time, and "letting a signal through" only while a control is 1 (the other input acts as a gate). In the half adder, the AND computes the carry: 1 + 1 carries one.',
      ] },
    ],
  },
  {
    kind: 'or', group: 'gates',
    summary: 'Gives 1 when at least one input is 1.',
    expr: 'S = A + B  (read "A or B")',
    table: t2((a, b) => a | b),
    guide: [
      { title: 'What it is', body: [
        'The OR gate gives 1 when at least one input is 1. It only gives 0 when every input is 0.',
        'Think of two switches in parallel: either one closed already turns the light on.',
      ] },
      { title: 'Boolean algebra', body: [
        'OR is written like a sum: A + B. Careful though: in logic 1 + 1 = 1, because there is no "2", only true or false.',
      ] },
      { title: 'In the real world', body: [
        'The 74·32 chip has four two-input OR gates.',
      ] },
      { title: 'What it is for', body: [
        'Combining alarms: "if the door OR the window opens, sound the siren". It is also used to merge several signals into one.',
      ] },
    ],
  },
  {
    kind: 'xor', group: 'gates',
    summary: 'Gives 1 when the inputs are different.',
    expr: 'S = A ⊕ B = A·B̄ + Ā·B',
    table: t2((a, b) => a ^ b),
    guide: [
      { title: 'What it is', body: [
        'The XOR gate (exclusive OR) gives 1 when exactly one of the inputs is 1, that is, when the inputs are different. If both are the same, the output is 0.',
      ] },
      { title: 'Handy properties', body: [
        'A ⊕ 0 = A: with one input at 0, the XOR passes the signal through unchanged.',
        'A ⊕ 1 = Ā: with one input at 1, it becomes a controllable inverter.',
        'A ⊕ A = 0, and XOR-ing twice with the same value undoes the operation. That is the basis of many ciphers and of parity.',
      ] },
      { title: 'In the real world', body: [
        'The 74·86 chip has four XOR gates.',
      ] },
      { title: 'What it is for', body: [
        'Adding bits: in the half adder, the XOR gives the sum bit (1 + 1 = 0, carry one). It also detects differences, computes parity to catch transmission errors and flips a signal under control.',
      ] },
    ],
  },
  {
    kind: 'nand', group: 'gates',
    summary: 'An inverted AND: gives 0 only when both are 1.',
    expr: 'S = ‾(A · B)',
    table: t2((a, b) => 1 - (a & b)),
    guide: [
      { title: 'What it is', body: [
        'NAND (NOT-AND) is an AND followed by a NOT. The output is 0 only when every input is 1; in any other case it is 1.',
      ] },
      { title: 'The universal gate', body: [
        'With NANDs you can build any other gate, and therefore any digital circuit:',
        'NOT: tie both inputs of a NAND together.',
        'AND: a NAND followed by a NOT made from a NAND.',
        'OR: invert each input with a NAND and join them in a third NAND (De Morgan\'s theorem: A + B = ‾(Ā · B̄)).',
        'Because it is cheap to make out of transistors, NAND is the basis of a lot of flash memory (the "NAND flash" in your phone).',
      ] },
      { title: 'In the real world', body: [
        'The 74·00 chip has four NANDs and was one of the first chips of the 7400 family.',
      ] },
    ],
  },
  {
    kind: 'nor', group: 'gates',
    summary: 'An inverted OR: gives 1 only when both are 0.',
    expr: 'S = ‾(A + B)',
    table: t2((a, b) => 1 - (a | b)),
    guide: [
      { title: 'What it is', body: [
        'NOR (NOT-OR) is an OR followed by a NOT. The output is 1 only when every input is 0.',
      ] },
      { title: 'Universal too', body: [
        'Just like NAND, NOR alone can build any circuit. The Apollo Guidance Computer, which took people to the Moon, was built entirely out of NOR gates.',
      ] },
      { title: 'Memory from two NORs', body: [
        'Wiring the output of each NOR into an input of the other makes an SR latch: a 1-bit memory. Turning S on stores 1, turning R on clears it, and with both off the circuit remembers the last value. Load the "SR latch" example to see it.',
      ] },
      { title: 'In the real world', body: [
        'The 74·02 chip has four two-input NORs.',
      ] },
    ],
  },
  {
    kind: 'xnor', group: 'gates',
    summary: 'Gives 1 when the inputs are equal.',
    expr: 'S = ‾(A ⊕ B)',
    table: t2((a, b) => 1 - (a ^ b)),
    guide: [
      { title: 'What it is', body: [
        'XNOR is an inverted XOR: it gives 1 when the inputs are equal (00 or 11) and 0 when they differ. That is why it is also called the equivalence gate.',
      ] },
      { title: 'What it is for', body: [
        'Comparing numbers: to know whether two 4-bit numbers are equal, use one XNOR per pair of bits and join the four outputs in an AND. The AND only lights up if every bit matches.',
      ] },
      { title: 'In the real world', body: [
        'The 74·266 chip has four XNORs.',
      ] },
    ],
  },
  {
    kind: 'dff', group: 'memory',
    summary: 'Stores 1 bit: copies D to Q when the clock rises.',
    expr: 'Q ← D  on the rising edge of CLK',
    table: { head: ['CLK', 'D', 'Q after'], rows: [['↑', '0', '0'], ['↑', '1', '1'], ['no edge', 'x', 'holds']] },
    guide: [
      { title: 'What it is', body: [
        'The D flip-flop is a 1-bit memory. It has two inputs, D (data) and CLK (clock), and two outputs, Q and Q̄ (the inverse of Q).',
        'At the instant CLK goes from 0 to 1 (rising edge), the flip-flop copies D into Q. The rest of the time, Q stays put, no matter what happens on D.',
      ] },
      { title: 'Why it matters', body: [
        'Gates alone are combinational: the output depends only on the inputs at that instant. With flip-flops the circuit has state, it remembers the past. That is what makes counting, storing numbers and running programs step by step possible.',
      ] },
      { title: 'Divide by 2 and counter', body: [
        'Wire Q̄ back into D. On every rising edge of the clock, the flip-flop stores the opposite of what it had, so Q flips on every pulse. The result is a signal at half the clock frequency.',
        'Chaining several of these, with the Q̄ of one acting as the clock of the next, gives you a binary counter. Load the "4-bit counter" example: the display shows 0, 1, 2... up to F and starts over.',
      ] },
      { title: 'In the real world', body: [
        'The 74·74 chip has two D flip-flops, with extra preset and clear inputs to force Q to 1 or 0.',
      ] },
    ],
  },
  {
    kind: 'led', group: 'outputs',
    summary: 'Lights up when its input is 1.',
    guide: [
      { title: 'What it is', body: [
        'The LED (light-emitting diode) is the simplest output: on with 1, off with 0. It is how you "see" the value of a wire.',
      ] },
      { title: 'Using it on the board', body: [
        'Wire the output of a gate into the LED input (on its left). Click the LED to change its colour. The first option follows the glow colour chosen on the top bar.',
      ] },
      { title: 'In the real world', body: [
        'A real LED needs a resistor in series to limit the current, usually between 220 Ω and 1 kΩ. Without it, the LED burns out. It also has polarity: the longer leg (anode) goes to positive.',
      ] },
    ],
  },
  {
    kind: 'seg7', group: 'outputs',
    summary: 'Shows the number on its 4 inputs in hexadecimal (0 to F).',
    table: { head: ['8', '4', '2', '1', 'shows'], rows: [
      ['0', '0', '0', '0', '0'], ['0', '0', '1', '1', '3'], ['0', '1', '0', '1', '5'],
      ['1', '0', '0', '1', '9'], ['1', '0', '1', '0', 'A'], ['1', '1', '1', '1', 'F'],
    ] },
    guide: [
      { title: 'What it is', body: [
        'The 7-segment display has seven bars (a to g) that, lit in different combinations, form numbers. This display already includes the decoder: you wire 4 bits and it shows the matching number in hexadecimal.',
      ] },
      { title: 'Binary to hexadecimal', body: [
        'The 4 inputs are worth 1, 2, 4 and 8. The number shown is the sum of the inputs that are at 1. Example: inputs 1 and 4 on give 5.',
        'With 4 bits you can count from 0 to 15. From 10 on, hexadecimal uses letters: A = 10, B = 11, C = 12, D = 13, E = 14 and F = 15.',
      ] },
      { title: 'In the real world', body: [
        'Common displays do not decode by themselves: a decoder chip such as the 74·47 (for BCD) takes the 4 bits and lights the right segments.',
      ] },
    ],
  },
];

const content: LearnContent = { groupNames: GROUP_NAMES, lessons: [...LESSONS].sort((a, b) => PALETTE.indexOf(a.kind) - PALETTE.indexOf(b.kind)), basics: BASICS };
export default content;
