package de.fsrfb4.fb4.view;

import android.content.Context;
import android.util.AttributeSet;

import androidx.appcompat.widget.AppCompatTextView;
import androidx.core.text.util.LinkifyCompat;

public class FixedAutoLinkTextView extends AppCompatTextView {
    public FixedAutoLinkTextView(Context context) {
        super(context);
    }

    public FixedAutoLinkTextView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public FixedAutoLinkTextView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onTextChanged(CharSequence text, int start, int lengthBefore, int lengthAfter) {
        super.onTextChanged(text, start, lengthBefore, lengthAfter);
        LinkifyCompat.addLinks(this, getAutoLinkMask());
    }
}
