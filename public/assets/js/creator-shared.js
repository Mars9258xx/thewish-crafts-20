/* Shared creator polish. Deliberately does not own form/save/share logic. */
(() => {
  const body = document.body;
  const relation = body?.dataset?.relation || '';
  if (!body || !relation) return;
  body.classList.add('wc-creator-page', `wc-creator-${relation.toLowerCase()}`);

  const labels = ['About them', 'From you', 'Your words + photo', 'Choose a design'];
  document.querySelectorAll('.wizard-step-indicator').forEach((el, i) => {
    if (labels[i]) {
      el.setAttribute('aria-label', `Step ${i + 1}: ${labels[i]}`);
      el.title = labels[i];
    }
  });

  document.querySelectorAll('.wizard-step-content').forEach((step, i) => {
    step.setAttribute('aria-label', labels[i] ? `Step ${i + 1}: ${labels[i]}` : `Step ${i + 1}`);
  });

  const photo = document.getElementById('photo');
  if (photo && !photo.getAttribute('aria-label')) photo.setAttribute('aria-label', 'Optional recipient photo');
  const crop = document.getElementById('wcCropZoom');
  if (crop && !crop.getAttribute('aria-label')) crop.setAttribute('aria-label', 'Photo zoom');
})();
