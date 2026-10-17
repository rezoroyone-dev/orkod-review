<template>
  <!--
    Clothed human figure for the symptom body map.

    This replaces a photographic, fully nude body render. That image was
    unsuitable for a site used by minors and by people in a health context:
    it exposed external genitalia from the default view, and nothing in the
    interface could prevent a user from rotating or zooming into it.

    The figure is drawn as a flat, clothed silhouette instead:
      * it is fully clothed by construction (a tunic covers the torso, pelvis
        and upper thighs), so no camera angle, zoom level or rotation can
        expose anatomy, because there is no anatomy drawn;
      * it is vector, so it stays crisp at any size and adds no image payload;
      * it is authored in the same 477x1000 viewBox as the interactive zone
        overlay in SymptomsPage.vue, so the existing head / neck / shoulders /
        abdomen / legs hit areas continue to line up with the body.

    Proportions follow the classic anatomical canon (~7.5 heads tall) so the
    silhouette reads unmistakably as a normal human being: head, neck, shoulders,
    torso, arms, hands, legs and feet are all present.

    Decorative only. It carries no labels and is hidden from assistive tech,
    because the zone overlay above it is the accessible control.
  -->
  <svg
    class="body-silhouette"
    viewBox="0 0 477 1000"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="bs-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#C4B5FD" />
        <stop offset="100%" stop-color="#8B5CF6" />
      </linearGradient>
      <linearGradient id="bs-cloth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6D28D9" />
        <stop offset="100%" stop-color="#3B1373" />
      </linearGradient>
    </defs>

    <g class="body-silhouette__skin" fill="url(#bs-skin)">
      <!-- Head: crown at y~20, chin at y~136 (7.5-head canon over a 1000 unit figure) -->
      <ellipse data-part="head" cx="253" cy="78" rx="45" ry="58" />

      <!-- Neck -->
      <path data-part="neck" d="M237 124 L269 124 L269 184 L237 184 Z" />

      <!-- Torso: shoulders taper to the waist, then widen slightly at the hips -->
      <path
        data-part="torso"
        d="M170 205
           C170 188 185 180 211 176
           L237 170 L269 170 L295 176
           C321 180 318 188 318 205
           C316 290 306 340 300 384
           C296 420 293 450 291 472
           L197 472
           C195 450 192 420 188 384
           C182 340 172 290 170 205 Z"
      />

      <!-- Left arm, tapering into the hand; the right arm is the same shape mirrored -->
      <path
        data-part="arm"
        d="M186 198
           C167 215 149 258 135 306
           C123 350 113 400 109 448
           L107 500
           C106 525 115 543 129 543
           C144 543 152 525 151 500
           L153 448
           C155 400 161 350 173 306
           C183 262 197 224 208 202 Z"
      />
      <g data-part="arm" transform="translate(488 0) scale(-1 1)">
        <path
          d="M186 198
             C167 215 149 258 135 306
             C123 350 113 400 109 448
             L107 500
             C106 525 115 543 129 543
             C144 543 152 525 151 500
             L153 448
             C155 400 161 350 173 306
             C183 262 197 224 208 202 Z"
        />
      </g>

      <!-- Left leg, tapering into the foot; the right leg is the same shape mirrored -->
      <path
        data-part="leg"
        d="M186 456
           C184 545 188 642 192 730
           C195 800 197 864 198 906
           C199 922 193 938 191 949
           C189 960 197 967 208 967
           L234 967
           C241 967 244 960 243 953
           C241 932 240 917 240 903
           C240 859 242 800 243 730
           C244 642 244 545 241 456 Z"
      />
      <g data-part="leg" transform="translate(488 0) scale(-1 1)">
        <path
          d="M186 456
             C184 545 188 642 192 730
             C195 800 197 864 198 906
             C199 922 193 938 191 949
             C189 960 197 967 208 967
             L234 967
             C241 967 244 960 243 953
             C241 932 240 917 240 903
             C240 859 242 800 243 730
             C244 642 244 545 241 456 Z"
        />
      </g>
    </g>

    <!--
      Clothing. A single tunic over the torso, pelvis and upper thighs. It is
      drawn as a distinct, darker shape rather than shading, so the covered
      region reads as dressed even in greyscale or for a colour-blind user.
      It spans the full hip line, so nothing below the waist is left as bare
      skin.
    -->
    <g class="body-silhouette__cloth" fill="url(#bs-cloth)">
      <!--
        The garment. One closed shape running from the shoulders down to a hem
        below the hip line, drawn over the skin rather than shaded into it, so
        the covered region still reads as dressed in greyscale and for a
        colour-blind user. All coordinates are absolute so the extent of the
        coverage is machine-verifiable (src/tests/moderation.safety.test.ts).
      -->
      <path
        d="M176 206
           C176 188 189 181 214 177
           L237 171 L269 171 L292 177
           C317 181 312 188 312 206
           C310 300 304 360 300 400
           C297 440 296 466 296 488
           C303 502 306 522 307 546
           C308 567 305 581 301 592
           L187 592
           C183 581 180 567 181 546
           C182 522 185 502 192 488
           C192 466 191 440 188 400
           C184 360 178 300 176 206 Z"
      />
    </g>

    <!-- midline, so the figure reads as anatomically symmetric -->
    <path
      class="body-silhouette__mid"
      d="M244 150 V462"
      stroke="rgba(11,7,24,0.28)"
      stroke-width="2"
      fill="none"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * Presentational only. No props, no state, no i18n: this is a decorative
 * backdrop for the interactive zone overlay owned by the page.
 */
</script>

<style scoped>
.body-silhouette {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}
</style>