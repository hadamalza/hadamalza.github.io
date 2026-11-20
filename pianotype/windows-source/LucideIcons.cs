using Svg;

namespace Pianotype;

static class LucideIcons {
 public static Bitmap Render(ButtonIcon icon, int size, Color color) => Render(icon switch {
  ButtonIcon.Add => "plus",
  ButtonIcon.Play => "play",
  ButtonIcon.Pause => "pause",
  ButtonIcon.Restart => "rotate-ccw",
  ButtonIcon.Piano => "piano",
  ButtonIcon.Minimize => "minus",
  _ => throw new ArgumentOutOfRangeException(nameof(icon))
 }, size, color);

 public static Bitmap Render(string name, int size, Color color) {
  string svg = Assets.Text($"Lucide.{name}.svg").Replace("currentColor", ColorTranslator.ToHtml(color));
  var document = SvgDocument.FromSvg<SvgDocument>(svg);
  return document.Draw(size, size);
 }
}
