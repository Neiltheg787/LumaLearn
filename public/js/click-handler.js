AFRAME.registerComponent("click-handler", {
  init: function () {
    const animatedMarker = document.querySelector("#animated-marker");
    const aEntity = document.querySelector("#animated-model");

    let atomDict = {
      helium: {
        x: {
          min: 0.001,
          max: 0.002,
        },
        y: {
          min: 0.0003,
          max: 0.001,
        },
      },
      carbon: {
        x: {
          min: 0.0004,
          max: 0.0007,
        },
        y: {
          min: 0.0002,
          max: 0.001,
        },
      },
      lithium: {
        x: {
          min: -0.001,
          max: -0.00005,
        },
        y: {
          min: -10,
          max: 1,
        },
      },
    };

    // every click, we make our model grow in size :)
    animatedMarker.addEventListener("click", function (ev, target) {
      console.log(ev.detail.intersection.point);
      for (let [atom, axis] of Object.entries(atomDict)) {
        document.getElementById(atom).setAttribute("visible", false);
        if (
          axis.x.min <= ev.detail.intersection.point.x &&
          ev.detail.intersection.point.x <= axis.x.max
        ) {
          if (
            axis.y.min <= ev.detail.intersection.point.y &&
            ev.detail.intersection.point.y <= axis.y.max
          ) {
            console.log(atom);
            document.getElementById(atom).setAttribute("visible", true);
          }
        }
      }
    });
  },
});
