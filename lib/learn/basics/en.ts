import type { Basic } from '../types.ts';

const basics: Basic[] = [
  {
    id: 'sinais', title: 'Digital signals: 0 and 1',
    body: [
      'A digital circuit represents information with two states: 0 and 1. Each value is a bit. Depending on the problem, these states can mean false and true, an open and closed door, or the absence and presence of a signal.',
      'On the board, a lit wire carries 1 and a dark wire carries 0. Its colour shows the current logic value; a pulse travelling along the wire highlights a change of state.',
    ],
    sections: [
      { title: 'A bit is not a specific voltage', body: [
        'In a physical circuit, 0 and 1 correspond to voltage ranges recognised by the components. Their limits depend on the technology and supply: 1 does not necessarily mean 1 volt. Voltages between the valid ranges can give undefined readings.',
        'This simulator uses ideal logic values. It does not calculate voltage, current, noise or the time a signal takes to pass through a gate. Use it to understand logic; a physical electronic design must account for those other quantities too.',
      ] },
      { title: 'From a state to information', body: [
        'A switch keeps its selected state until you click again. A button sends 1 while held and returns to 0 when released. A clock alternates automatically. All three produce bits, but they change in different ways.',
        'Meaning comes from the connections and the circuit rule. An LED can stand for a lamp, permission or a result. Before building, decide what 0 and 1 mean at each input and what you expect at the output.',
      ] },
      { title: 'Several bits represent numbers', body: [
        'Two bits have four combinations: 00, 01, 10 and 11. As binary numbers, these represent 0, 1, 2 and 3. The bit on the left is worth 2 and the bit on the right is worth 1.',
        'For four bits, the weights are 8, 4, 2 and 1. For example, 0101 represents 4 + 1 = 5. In general, n bits allow 2ⁿ combinations. A single board wire carries one bit, so a four-bit number needs four signals.',
      ], table: { head: ['Binary', 'Calculation', 'Decimal'], rows: [['00', '0×2 + 0×1', '0'], ['01', '0×2 + 1×1', '1'], ['10', '1×2 + 0×1', '2'], ['11', '1×2 + 1×1', '3']] } },
    ],
    practice: { title: 'Follow a bit from the switch to the LED', demo: 'led', steps: [
      'Open the demonstration: a switch is wired directly to an LED.',
      'Click switch A and watch the wire and LED change. Click again to return to 0.',
      'Change the LED colour. Did the meaning of the signal change, or just its appearance?',
    ], explanation: 'The LED follows the switch bit: A = 0 leaves it off and A = 1 turns it on. Changing the colour does not affect the logic value or the connections.' },
  },
  {
    id: 'fios', title: 'Inputs, outputs and wires',
    body: [
      'A circuit is a network of components. Inputs receive signals, each component applies its rule, and outputs deliver the result to the next stage. On the board, inputs sit on the left of a part and outputs on the right.',
      'To make a connection, drag from an output pin to an input pin. You can also tap one pin and then the other. Positioning the parts keeps the drawing organised, but the wires define the circuit.',
    ],
    sections: [
      { title: 'Follow the signal path', body: [
        'Start at a source: a switch, button, clock or source 1. Follow its wire to a gate input, apply that gate’s rule and continue from its output. An LED lets you observe the value at the end of the path.',
        'Distinguish a pin from the body of a component. Use the small connection points to wire parts. Crossing two wires in the drawing does not create a junction: each wire keeps the source and destination pins you selected.',
      ] },
      { title: 'One output can have several destinations', body: [
        'In the simulator, one output can feed several inputs. This is useful for sending A to two gates or connecting A to both pins of a NAND. All those destinations receive the same bit.',
        'Each input accepts one wire. Connecting another output to an occupied input replaces the previous wire. This does not add signals together: to combine A and B, use a gate such as AND, OR or XOR.',
      ] },
      { title: 'Missing connections and troubleshooting', body: [
        'An unwired input reads 0 in this simulator. In real hardware, a disconnected input can float and needs a defined level, for example through a pull-up or pull-down resistor. The board rule is a simplification, not a recommendation for physical wiring.',
        'If a result is unexpected, check the source, destination pin and observed output, in that order. Select and delete a wire to reconnect it. Moving a part keeps its connections; dragging it onto the parts menu removes it and its attached wires.',
      ] },
    ],
    practice: { title: 'Feed two inputs with the same signal', demo: 'nand', steps: [
      'Open the NAND demonstration and identify the two switches feeding the gate.',
      'Connect switch A’s output to the NAND input currently fed by B. The new connection replaces the old one.',
      'Toggle A. Then toggle B, which is now disconnected from the gate, and compare their effects.',
    ], explanation: 'Both NAND inputs now receive A. With A = 0, the LED turns on; with A = 1, it turns off. B no longer affects the output because its wire was replaced.' },
  },
  {
    id: 'tabela', title: 'Truth table',
    body: [
      'A truth table describes a combinational circuit for every input combination. Each row is a complete test: choose the input values and record the expected values at the outputs.',
      'With n independent inputs there are 2ⁿ combinations. One input gives two rows, two give four, three give eight and four give sixteen. A table turns a rule into something you can verify.',
    ],
    sections: [
      { title: 'List every combination', body: [
        'Counting in binary is a reliable approach. For A and B, use 00, 01, 10 and 11. For A, B and C, go from 000 to 111. Row order can vary, but every combination must appear exactly once.',
        'Separate the input columns from the output columns. A circuit with two outputs, such as a half adder, has one column for each result in the same row. Extra outputs do not require extra rows.',
      ] },
      { title: 'Example: AND, OR and XOR', body: [
        'AND requires both conditions to be true. OR accepts one or both. XOR requires different values. Row 11 is particularly useful: it distinguishes OR, which produces 1, from XOR, which produces 0.',
      ], table: { head: ['A', 'B', 'AND', 'OR', 'XOR'], rows: [['0', '0', '0', '0', '0'], ['0', '1', '0', '1', '1'], ['1', '0', '0', '1', '1'], ['1', '1', '1', '1', '0']] } },
      { title: 'From the table to a circuit test', body: [
        'Use one switch per input and one LED per output. Step through every row and compare the result. A single different row means the circuit does not implement the complete rule, even if the other cases work.',
        'The truth table panel automates this process, and the challenge Check button compares rows with the expected answer. A table of current inputs alone cannot describe memory: sequential circuits must also account for previous state and clock events.',
      ] },
    ],
    practice: { title: 'Test the difference between OR and XOR', demo: 'xor', steps: [
      'Open the XOR demonstration and step through 00, 01, 10 and 11 using switches A and B.',
      'Write down the LED value in each row before checking the table above.',
      'Replace XOR with OR, reconnect the wires and find the row that changes.',
    ], explanation: 'XOR produces 0, 1, 1, 0; OR produces 0, 1, 1, 1. Only A = B = 1 changes. Testing just 00, 01 and 10 does not distinguish these circuits.' },
  },
  {
    id: 'boole', title: 'Boolean algebra',
    body: [
      'Boolean algebra lets you write and transform rules using 0 and 1. Instead of drawing every wire first, describe the output with an expression and then choose gates that implement it.',
      'In this guide, A·B means AND, A+B means OR, ¬A means NOT and A⊕B means XOR. A bar above a letter, as in Ā, also means negation. These symbols represent logical operations, not ordinary arithmetic addition.',
    ],
    sections: [
      { title: 'Read an expression in stages', body: [
        'In Y = A·¬B, first invert B and then AND it with A. The output is 1 only when A is on and B is off. Build it with a NOT on B, then connect that output and A to an AND.',
        'Use parentheses to make the order explicit. ¬(A·B) inverts the result of AND and is a NAND; (¬A)·B inverts only A. The two expressions are not equivalent.',
      ], expression: 'Y = A·¬B' },
      { title: 'Simplify before building', body: [
        'Some identities eliminate unnecessary work: A·1 = A, A+0 = A, A·0 = 0 and A+1 = 1. Also, A·A = A and A+A = A. Notice that 1+1 = 1 for OR; this is not binary addition, where 1+1 = 10.',
        'For example, A·B + A·¬B = A·(B+¬B) = A·1 = A. The circuit may appear to depend on B, but its result is always A. Compare all four truth table rows to confirm the equivalence.',
      ], expression: 'A·B + A·¬B = A' },
      { title: 'De Morgan and universal gates', body: [
        'De Morgan’s laws state that ¬(A·B) = ¬A+¬B and ¬(A+B) = ¬A·¬B. When moving negation inside the parentheses, swap AND for OR or OR for AND, and negate each input.',
        'A NAND with both inputs tied to A produces ¬A. Two NAND gates can form an AND by inverting the first output again. Using inversion and De Morgan, you can also build OR. This is why NAND is universal; an equivalent construction uses only NOR.',
      ], table: { head: ['A', 'B', '¬(A·B)', '¬A+¬B'], rows: [['0', '0', '1', '1'], ['0', '1', '1', '1'], ['1', '0', '1', '1'], ['1', '1', '0', '0']] } },
    ],
    practice: { title: 'Turn NAND into NOT', demo: 'nand', steps: [
      'Open the NAND demonstration and connect switch A to both gate inputs.',
      'Predict the output for A = 0 and A = 1 using ¬(A·A).',
      'Compare it with a NOT gate receiving the same signal.',
    ], explanation: 'Since A·A = A, the expression ¬(A·A) simplifies to ¬A. Both circuits produce 1 with A = 0 and 0 with A = 1. They are logically equivalent despite using different components.' },
  },
  {
    id: 'combinacional', title: 'Combinational and sequential',
    body: [
      'The central difference is state. In a combinational circuit, knowing the current inputs is enough to determine the outputs. In a sequential circuit, you must also know what was stored before.',
      'An adder is combinational. A register or counter is sequential. The same inputs can produce different results at different times if the stored state has changed.',
    ],
    sections: [
      { title: 'Combinational: a function of the inputs', body: [
        'AND, OR, XOR, MUX and adders are examples of combinational functions. Repeating the same input combination gives the same output after the circuit settles.',
        'In the simulator, this seems immediate. In real electronics, each gate has a propagation delay, and different paths can produce temporary pulses. A truth table describes the settled result, not those timing details.',
      ] },
      { title: 'Sequential: the past is part of the answer', body: [
        'A D flip-flop stores one bit in Q. D is the data to store and CLK determines when it is captured. In the board’s flip-flop, Q receives D only at the rising edge: when CLK changes from 0 to 1.',
        'After capture, changing D does not affect Q until the next rising edge. Keeping CLK at 1 does not continuously capture new data either. A fall from 1 to 0 prepares another pulse but does not store D in this model.',
      ], table: { head: ['CLK event', 'D', 'Next Q'], rows: [['No rising edge', '0 or 1', 'Previous Q'], ['0 → 1', '0', '0'], ['0 → 1', '1', '1'], ['1 → 0', '0 or 1', 'Previous Q']] } },
      { title: 'Clocks, latches and feedback', body: [
        'A clock organises updates at regular intervals. Its frequency in hertz measures cycles per second: 2 Hz means two complete cycles per second. An edge is an event within a cycle, not the entire cycle.',
        'Not all memory uses a clock: an SR latch responds to control inputs, for example. Feedback can store state, but connecting outputs back to inputs without analysing the circuit can also cause oscillation. The instability warning means the simulator did not find a stable state.',
      ] },
    ],
    practice: { title: 'Store a bit and change the input', demo: 'dff', steps: [
      'Open the D flip-flop demonstration. The switch supplies D and the button connects to CLK.',
      'Set D to 1, press and release the button. Observe Q on the first LED.',
      'Change D to 0 without pressing the button. Then press the button again and compare.',
    ], explanation: 'The first button rising edge stores Q = 1. Changing D to 0 leaves Q at 1 because the bit is stored. The next rising edge stores Q = 0. The other LED shows Q̄, the complement of Q.' },
  },
  {
    id: 'somador', title: 'Example: half adder',
    body: [
      'The half adder brings the fundamentals together in a useful circuit: it adds two bits, A and B. The result needs two bits because 1+1 exceeds the largest value a single bit can hold.',
      'Its outputs are S, the sum bit, and C, the carry. To read the complete number, write C to the left of S. The numeric order is CS, even if the circuit presents its LEDs as S and C.',
    ],
    sections: [
      { title: 'Start with addition, not gates', body: [
        'List the four possibilities for A and B and add them in binary. 0+0 gives 00; 0+1 and 1+0 give 01; 1+1 gives 10. The first result digit is C and the second is S.',
        'Separating the result into columns reveals each output’s role: S is 1 when the inputs differ, and C is 1 only when both inputs are 1.',
      ], table: { head: ['A', 'B', 'S', 'C', 'CS'], rows: [['0', '0', '0', '0', '00'], ['0', '1', '1', '0', '01'], ['1', '0', '1', '0', '01'], ['1', '1', '0', '1', '10']] } },
      { title: 'Translate the table into components', body: [
        'The S column is the XOR truth table: S = A⊕B. The C column is AND: C = A·B. Each switch must feed both gates, using two wires from the same output pin.',
        'Connect XOR to the sum LED and AND to the carry LED. Do not connect both outputs to the same pin: they represent different bits and must be observed separately.',
      ], expression: 'S = A⊕B; C = A·B' },
      { title: 'From a half adder to multi-bit addition', body: [
        'A half adder cannot receive a carry from the previous column. For later columns, use a full adder: it adds A, B and Cin, the incoming carry, and produces S and Cout.',
        'For two-bit addition, start with the least significant bits. Connect that stage’s C to the next stage’s Cin. The first stage can be a half adder; subsequent stages must accept a carry. The final Cout adds another result bit when needed.',
      ] },
    ],
    practice: { title: 'Check both bits of the result', demo: 'halfadder', steps: [
      'Open the half adder demonstration. The first LED shows S and the second shows C.',
      'Test all four A and B combinations and compare them with the table.',
      'Leave both switches at 1. Read the result as C followed by S and convert it to decimal.',
    ], explanation: 'With A = B = 1, the S LED turns off and the C LED turns on. This represents CS = 10₂, which is 2 in decimal. An unlit sum LED does not mean the complete result is zero.' },
  },
];

export default basics;
