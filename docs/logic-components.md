# Component model and references

The board uses ideal, one-bit binary logic. Unwired inputs read as 0. It does not simulate current, voltage, propagation delay, floating signals or tri-state outputs.

The additional components follow the Logisim Evolution library documentation:

- [Buffer](https://github.com/logisim-evolution/logisim-evolution/blob/main/src/main/resources/doc/en/html/libs/gates/buffer.html): Y = A. A buffer does not invert or add an enable input.
- [AND / OR](https://github.com/logisim-evolution/logisim-evolution/blob/main/src/main/resources/doc/en/html/libs/gates/basic.html): the three-input variants apply AND / OR to all three inputs.
- [Multiplexer](https://github.com/logisim-evolution/logisim-evolution/blob/main/src/main/resources/doc/en/html/libs/plexers/mux.html): a 2:1, one-bit selector. S = 0 chooses A; S = 1 chooses B. No enable input in this board's model.
- [Demultiplexer](https://github.com/logisim-evolution/logisim-evolution/blob/main/src/main/resources/doc/en/html/libs/plexers/demux.html): a 1:2, one-bit distributor. S selects Y0 or Y1; the unselected output is 0. No enable input or floating state.
- [Adder](https://github.com/logisim-evolution/logisim-evolution/blob/main/src/main/resources/doc/en/html/libs/arith/adder.html): the full adder computes A + B + Cin, with low bit S and carry Cout. The half adder computes A + B without Cin.

The Learn pages in English and Portuguese include pin mappings, truth tables, expressions, usage notes and a runnable demo for each part. Tests exercise every binary input combination and compare the lesson tables against the simulator. Challenge tests use complete working circuits, including a cascaded decoder and a two-bit ripple-carry adder.

Existing challenge IDs and browser progress remain valid. The original half-adder and full-adder exercises restrict parts so the new packaged adders do not bypass their construction goals.
