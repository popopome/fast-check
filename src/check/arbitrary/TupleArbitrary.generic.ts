import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneMethod, hasCloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';

/** @hidden */
class GenericTupleArbitrary<Ts> extends Arbitrary<Ts[]> {
  constructor(readonly arbs: Arbitrary<Ts>[]) {
    super();
    for (let idx = 0; idx !== arbs.length; ++idx) {
      const arb = arbs[idx];
      if (arb == null || arb.generate == null)
        throw new Error(`Invalid parameter encountered at index ${idx}: expecting an Arbitrary`);
    }
  }
  private static clone<Ts>(vs: Ts[]): Ts[] {
    const values: Ts[] = [];
    for (let idx = 0; idx !== vs.length; ++idx) {
      const v = vs[idx];
      if (hasCloneMethod(v)) {
        values.push(v[cloneMethod]());
      } else {
        values.push(v);
      }
    }
    return values;
  }
  private static cloneIf<Ts>(vs: Ts[], cloneable: boolean): Ts[] {
    return cloneable ? this.clone(vs) : vs;
  }
  private static wrapper<Ts>(shrinkables: Shrinkable<Ts>[]): Shrinkable<Ts[]> {
    let cloneable = false;
    let values: Ts[] = [];
    for (let idx = 0; idx !== shrinkables.length; ++idx) {
      const v = shrinkables[idx].value;
      cloneable = cloneable || hasCloneMethod(v);
      values.push(v);
    }
    if (cloneable) {
      values = Object.assign(values, { [cloneMethod]: GenericTupleArbitrary.clone });
    }
    return new Shrinkable(values, () =>
      GenericTupleArbitrary.shrinkImpl(cloneable, shrinkables).map(GenericTupleArbitrary.wrapper)
    );
  }
  generate(mrng: Random): Shrinkable<Ts[]> {
    return GenericTupleArbitrary.wrapper(this.arbs.map(a => a.generate(mrng)));
  }
  private static shrinkImpl<Ts>(cloneable: boolean, value: Shrinkable<Ts>[]): Stream<Shrinkable<Ts>[]> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    let s = Stream.nil<Shrinkable<Ts>[]>();
    for (let idx = 0; idx !== value.length; ++idx) {
      s = s.join(
        value[idx].shrink().map(v =>
          GenericTupleArbitrary.cloneIf(value.slice(0, idx), cloneable)
            .concat([v])
            .concat(GenericTupleArbitrary.cloneIf(value.slice(idx + 1), cloneable))
        )
      );
    }
    return s;
  }
  withBias(freq: number) {
    return new GenericTupleArbitrary(this.arbs.map(a => a.withBias(freq)));
  }
}

/**
 * For tuples produced by the provided `arbs`
 * @param arbs Ordered list of arbitraries
 */
function genericTuple<Ts>(arbs: Arbitrary<Ts>[]): Arbitrary<Ts[]> {
  return new GenericTupleArbitrary(arbs);
}

export { GenericTupleArbitrary, genericTuple };
