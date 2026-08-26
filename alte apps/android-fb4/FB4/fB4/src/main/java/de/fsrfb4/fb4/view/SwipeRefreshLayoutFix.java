package de.fsrfb4.fb4.view;

import android.content.Context;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import android.util.AttributeSet;
import android.view.View;
import android.widget.AbsListView;

public class SwipeRefreshLayoutFix extends SwipeRefreshLayout {

    public SwipeRefreshLayoutFix(Context context) {
        super(context);
        // TODO Auto-generated constructor stub
    }

    public SwipeRefreshLayoutFix(Context context, AttributeSet attrs) {
        super(context, attrs);
        // TODO Auto-generated constructor stub
    }

    @Override
    public boolean canChildScrollUp() {
        View target = getChildAt(0);
        if (target instanceof AbsListView) {
            final AbsListView absListView = (AbsListView) target;
            return absListView.getChildCount() > 0
                && (absListView.getFirstVisiblePosition() > 0 || absListView.getChildAt(0)
                .getTop() < absListView.getPaddingTop());
        } else {
            return target.getScrollY() > 0;
        }
    }

}
