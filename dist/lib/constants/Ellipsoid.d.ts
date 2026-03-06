export default ellipsoids;
declare namespace ellipsoids {
    namespace MERIT {
        let a: number;
        let rf: number;
        let ellipseName: string;
    }
    namespace SGS85 {
        let a_1: number;
        export { a_1 as a };
        let rf_1: number;
        export { rf_1 as rf };
        let ellipseName_1: string;
        export { ellipseName_1 as ellipseName };
    }
    namespace GRS80 {
        let a_2: number;
        export { a_2 as a };
        let rf_2: number;
        export { rf_2 as rf };
        let ellipseName_2: string;
        export { ellipseName_2 as ellipseName };
    }
    namespace IAU76 {
        let a_3: number;
        export { a_3 as a };
        let rf_3: number;
        export { rf_3 as rf };
        let ellipseName_3: string;
        export { ellipseName_3 as ellipseName };
    }
    namespace airy {
        let a_4: number;
        export { a_4 as a };
        export let b: number;
        let ellipseName_4: string;
        export { ellipseName_4 as ellipseName };
    }
    namespace APL4 {
        let a_5: number;
        export { a_5 as a };
        let rf_4: number;
        export { rf_4 as rf };
        let ellipseName_5: string;
        export { ellipseName_5 as ellipseName };
    }
    namespace NWL9D {
        let a_6: number;
        export { a_6 as a };
        let rf_5: number;
        export { rf_5 as rf };
        let ellipseName_6: string;
        export { ellipseName_6 as ellipseName };
    }
    namespace mod_airy {
        let a_7: number;
        export { a_7 as a };
        let b_1: number;
        export { b_1 as b };
        let ellipseName_7: string;
        export { ellipseName_7 as ellipseName };
    }
    namespace andrae {
        let a_8: number;
        export { a_8 as a };
        let rf_6: number;
        export { rf_6 as rf };
        let ellipseName_8: string;
        export { ellipseName_8 as ellipseName };
    }
    namespace aust_SA {
        let a_9: number;
        export { a_9 as a };
        let rf_7: number;
        export { rf_7 as rf };
        let ellipseName_9: string;
        export { ellipseName_9 as ellipseName };
    }
    namespace GRS67 {
        let a_10: number;
        export { a_10 as a };
        let rf_8: number;
        export { rf_8 as rf };
        let ellipseName_10: string;
        export { ellipseName_10 as ellipseName };
    }
    namespace bessel {
        let a_11: number;
        export { a_11 as a };
        let rf_9: number;
        export { rf_9 as rf };
        let ellipseName_11: string;
        export { ellipseName_11 as ellipseName };
    }
    namespace bess_nam {
        let a_12: number;
        export { a_12 as a };
        let rf_10: number;
        export { rf_10 as rf };
        let ellipseName_12: string;
        export { ellipseName_12 as ellipseName };
    }
    namespace clrk66 {
        let a_13: number;
        export { a_13 as a };
        let b_2: number;
        export { b_2 as b };
        let ellipseName_13: string;
        export { ellipseName_13 as ellipseName };
    }
    namespace clrk80 {
        let a_14: number;
        export { a_14 as a };
        let rf_11: number;
        export { rf_11 as rf };
        let ellipseName_14: string;
        export { ellipseName_14 as ellipseName };
    }
    namespace clrk80ign {
        let a_15: number;
        export { a_15 as a };
        let b_3: number;
        export { b_3 as b };
        let rf_12: number;
        export { rf_12 as rf };
        let ellipseName_15: string;
        export { ellipseName_15 as ellipseName };
    }
    namespace clrk58 {
        let a_16: number;
        export { a_16 as a };
        let rf_13: number;
        export { rf_13 as rf };
        let ellipseName_16: string;
        export { ellipseName_16 as ellipseName };
    }
    namespace CPM {
        let a_17: number;
        export { a_17 as a };
        let rf_14: number;
        export { rf_14 as rf };
        let ellipseName_17: string;
        export { ellipseName_17 as ellipseName };
    }
    namespace delmbr {
        let a_18: number;
        export { a_18 as a };
        let rf_15: number;
        export { rf_15 as rf };
        let ellipseName_18: string;
        export { ellipseName_18 as ellipseName };
    }
    namespace engelis {
        let a_19: number;
        export { a_19 as a };
        let rf_16: number;
        export { rf_16 as rf };
        let ellipseName_19: string;
        export { ellipseName_19 as ellipseName };
    }
    namespace evrst30 {
        let a_20: number;
        export { a_20 as a };
        let rf_17: number;
        export { rf_17 as rf };
        let ellipseName_20: string;
        export { ellipseName_20 as ellipseName };
    }
    namespace evrst48 {
        let a_21: number;
        export { a_21 as a };
        let rf_18: number;
        export { rf_18 as rf };
        let ellipseName_21: string;
        export { ellipseName_21 as ellipseName };
    }
    namespace evrst56 {
        let a_22: number;
        export { a_22 as a };
        let rf_19: number;
        export { rf_19 as rf };
        let ellipseName_22: string;
        export { ellipseName_22 as ellipseName };
    }
    namespace evrst69 {
        let a_23: number;
        export { a_23 as a };
        let rf_20: number;
        export { rf_20 as rf };
        let ellipseName_23: string;
        export { ellipseName_23 as ellipseName };
    }
    namespace evrstSS {
        let a_24: number;
        export { a_24 as a };
        let rf_21: number;
        export { rf_21 as rf };
        let ellipseName_24: string;
        export { ellipseName_24 as ellipseName };
    }
    namespace fschr60 {
        let a_25: number;
        export { a_25 as a };
        let rf_22: number;
        export { rf_22 as rf };
        let ellipseName_25: string;
        export { ellipseName_25 as ellipseName };
    }
    namespace fschr60m {
        let a_26: number;
        export { a_26 as a };
        let rf_23: number;
        export { rf_23 as rf };
        let ellipseName_26: string;
        export { ellipseName_26 as ellipseName };
    }
    namespace fschr68 {
        let a_27: number;
        export { a_27 as a };
        let rf_24: number;
        export { rf_24 as rf };
        let ellipseName_27: string;
        export { ellipseName_27 as ellipseName };
    }
    namespace helmert {
        let a_28: number;
        export { a_28 as a };
        let rf_25: number;
        export { rf_25 as rf };
        let ellipseName_28: string;
        export { ellipseName_28 as ellipseName };
    }
    namespace hough {
        let a_29: number;
        export { a_29 as a };
        let rf_26: number;
        export { rf_26 as rf };
        let ellipseName_29: string;
        export { ellipseName_29 as ellipseName };
    }
    namespace intl {
        let a_30: number;
        export { a_30 as a };
        let rf_27: number;
        export { rf_27 as rf };
        let ellipseName_30: string;
        export { ellipseName_30 as ellipseName };
    }
    namespace kaula {
        let a_31: number;
        export { a_31 as a };
        let rf_28: number;
        export { rf_28 as rf };
        let ellipseName_31: string;
        export { ellipseName_31 as ellipseName };
    }
    namespace lerch {
        let a_32: number;
        export { a_32 as a };
        let rf_29: number;
        export { rf_29 as rf };
        let ellipseName_32: string;
        export { ellipseName_32 as ellipseName };
    }
    namespace mprts {
        let a_33: number;
        export { a_33 as a };
        let rf_30: number;
        export { rf_30 as rf };
        let ellipseName_33: string;
        export { ellipseName_33 as ellipseName };
    }
    namespace new_intl {
        let a_34: number;
        export { a_34 as a };
        let b_4: number;
        export { b_4 as b };
        let ellipseName_34: string;
        export { ellipseName_34 as ellipseName };
    }
    namespace plessis {
        let a_35: number;
        export { a_35 as a };
        let rf_31: number;
        export { rf_31 as rf };
        let ellipseName_35: string;
        export { ellipseName_35 as ellipseName };
    }
    namespace krass {
        let a_36: number;
        export { a_36 as a };
        let rf_32: number;
        export { rf_32 as rf };
        let ellipseName_36: string;
        export { ellipseName_36 as ellipseName };
    }
    namespace SEasia {
        let a_37: number;
        export { a_37 as a };
        let b_5: number;
        export { b_5 as b };
        let ellipseName_37: string;
        export { ellipseName_37 as ellipseName };
    }
    namespace walbeck {
        let a_38: number;
        export { a_38 as a };
        let b_6: number;
        export { b_6 as b };
        let ellipseName_38: string;
        export { ellipseName_38 as ellipseName };
    }
    namespace WGS60 {
        let a_39: number;
        export { a_39 as a };
        let rf_33: number;
        export { rf_33 as rf };
        let ellipseName_39: string;
        export { ellipseName_39 as ellipseName };
    }
    namespace WGS66 {
        let a_40: number;
        export { a_40 as a };
        let rf_34: number;
        export { rf_34 as rf };
        let ellipseName_40: string;
        export { ellipseName_40 as ellipseName };
    }
    namespace WGS7 {
        let a_41: number;
        export { a_41 as a };
        let rf_35: number;
        export { rf_35 as rf };
        let ellipseName_41: string;
        export { ellipseName_41 as ellipseName };
    }
    namespace WGS84 {
        let a_42: number;
        export { a_42 as a };
        let rf_36: number;
        export { rf_36 as rf };
        let ellipseName_42: string;
        export { ellipseName_42 as ellipseName };
    }
    namespace sphere {
        let a_43: number;
        export { a_43 as a };
        let b_7: number;
        export { b_7 as b };
        let ellipseName_43: string;
        export { ellipseName_43 as ellipseName };
    }
}
