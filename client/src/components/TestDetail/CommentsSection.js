import React from 'react';

const CommentsSection = ({ comments }) => (
  <div className="comments-section">
    <h3>Comment</h3>
    {comments.map((comment) => (
      <div key={comment.id} className="comment">
        <p>
          <strong>{comment.user}</strong>: {comment.text}
        </p>
      </div>
    ))}
  </div>
);

export default CommentsSection;
