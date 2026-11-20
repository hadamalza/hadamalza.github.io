using System.Drawing.Drawing2D;

namespace Pianotype;

enum ButtonIcon { None, Add, Play, Pause, Restart, Piano, Minimize }

static class RoundedShape {
 public static GraphicsPath Create(RectangleF bounds, float radius) {
  var path = new GraphicsPath();
  float diameter = Math.Min(radius * 2, Math.Min(bounds.Width, bounds.Height));
  path.AddArc(bounds.Left, bounds.Top, diameter, diameter, 180, 90);
  path.AddArc(bounds.Right - diameter, bounds.Top, diameter, diameter, 270, 90);
  path.AddArc(bounds.Right - diameter, bounds.Bottom - diameter, diameter, diameter, 0, 90);
  path.AddArc(bounds.Left, bounds.Bottom - diameter, diameter, diameter, 90, 90);
  path.CloseFigure();
  return path;
 }
}

sealed class RoundedButton : Button {
 ButtonIcon icon;
 bool hovered, pressed;
 Bitmap? iconImage;
 ButtonIcon renderedIcon;
 Color renderedColor;
 [System.ComponentModel.DefaultValue(ButtonIcon.None)]
 public ButtonIcon Icon { get => icon; set { icon = value; Invalidate(); } }

 public RoundedButton() {
  SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
  FlatStyle = FlatStyle.Flat;
  FlatAppearance.BorderSize = 0;
  UseVisualStyleBackColor = false;
 }

 protected override void Dispose(bool disposing) { if (disposing) iconImage?.Dispose(); base.Dispose(disposing); }

 protected override void OnMouseEnter(EventArgs e) { hovered = true; Invalidate(); base.OnMouseEnter(e); }
 protected override void OnMouseLeave(EventArgs e) { hovered = pressed = false; Invalidate(); base.OnMouseLeave(e); }
 protected override void OnMouseDown(MouseEventArgs e) { pressed = true; Invalidate(); base.OnMouseDown(e); }
 protected override void OnMouseUp(MouseEventArgs e) { pressed = false; Invalidate(); base.OnMouseUp(e); }
 protected override void OnGotFocus(EventArgs e) { Invalidate(); base.OnGotFocus(e); }
 protected override void OnLostFocus(EventArgs e) { Invalidate(); base.OnLostFocus(e); }

 protected override void OnPaint(PaintEventArgs e) {
  var g = e.Graphics;
  g.Clear(Parent?.BackColor ?? BackColor);
  g.SmoothingMode = SmoothingMode.AntiAlias;
  float scale = DeviceDpi / 96f;
  using var shape = RoundedShape.Create(new RectangleF(.5f, .5f, Width - 1, Height - 1), 9 * scale);
  Color fill = BackColor;
  if (hovered) {
   double amount = pressed ? .12 : .06;
   fill = Color.FromArgb((int)(fill.R * (1 - amount) + 58 * amount),
    (int)(fill.G * (1 - amount) + 66 * amount), (int)(fill.B * (1 - amount) + 52 * amount));
  }
  using var brush = new SolidBrush(fill);
  using var border = new Pen(Color.FromArgb(220, 222, 211), scale);
  g.FillPath(brush, shape);
  if (BackColor.GetBrightness() > .6f) g.DrawPath(border, shape);
  if (Icon == ButtonIcon.None) {
   TextRenderer.DrawText(g, Text, Font, ClientRectangle, Enabled ? ForeColor : SystemColors.GrayText,
    TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine);
  } else {
   int iconSize = (int)Math.Round(18 * scale);
   Color iconColor = Enabled ? ForeColor : SystemColors.GrayText;
   if (iconImage == null || renderedIcon != Icon || renderedColor != iconColor || iconImage.Width != iconSize) {
    iconImage?.Dispose();
    iconImage = LucideIcons.Render(Icon, iconSize, iconColor);
    renderedIcon = Icon;
    renderedColor = iconColor;
   }
   g.DrawImageUnscaled(iconImage, (Width - iconSize) / 2, (Height - iconSize) / 2);
  }
  if (Focused && ShowFocusCues) {
   using var focus = new Pen(Color.FromArgb(135, 154, 112), scale) { DashStyle = DashStyle.Dot };
   using var ring = RoundedShape.Create(new RectangleF(3, 3, Width - 6, Height - 6), 6 * scale);
   g.DrawPath(focus, ring);
  }
 }
}

sealed class RoundedComboBox : ComboBox {
 public RoundedComboBox() { FlatStyle = FlatStyle.Flat; BackColor = Color.White; }

 protected override void OnResize(EventArgs e) {
  base.OnResize(e);
  if (Width <= 0 || Height <= 0) return;
  using var shape = RoundedShape.Create(new RectangleF(0, 0, Width, Height), 9 * DeviceDpi / 96f);
  var previous = Region;
  Region = new Region(shape);
  previous?.Dispose();
 }

 protected override void WndProc(ref Message m) {
  base.WndProc(ref m);
  if (m.Msg != 0xF) return;
  using var g = Graphics.FromHwnd(Handle);
  g.SmoothingMode = SmoothingMode.AntiAlias;
  float scale = DeviceDpi / 96f;
  using var background = new SolidBrush(BackColor);
  g.FillRectangle(background, Width - 28 * scale, 0, 28 * scale, Height);
  using var outline = new Pen(Color.FromArgb(220, 222, 211), scale);
  using var shape = RoundedShape.Create(new RectangleF(.5f, .5f, Width - 1, Height - 1), 9 * scale);
  g.DrawPath(outline, shape);
  int iconSize = (int)Math.Round(16 * scale);
  using var arrow = LucideIcons.Render("chevron-down", iconSize, ForeColor);
  g.DrawImageUnscaled(arrow, Width - (int)(23 * scale), (Height - iconSize) / 2);
 }
}
